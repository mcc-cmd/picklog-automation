<?php
/**
 * Administrator-only REST API used by the PICKLOG publisher (Render cron job).
 * Authentication: WordPress application password of an administrator.
 * Namespace: /wp-json/picklog/v1/
 */
if (!defined('ABSPATH')) exit;

final class Picklog_Lab_REST {
	const NS = 'picklog/v1';
	const KEY_META = '_picklog_key';
	const HASH_META = '_picklog_hash';
	const DESC_META = '_picklog_meta_description';

	static function init() { add_action('rest_api_init', [__CLASS__, 'routes']); }

	static function can() { return current_user_can('manage_options'); }

	static function routes() {
		$r = function ($path, $methods, $cb) {
			register_rest_route(self::NS, $path, ['methods' => $methods, 'callback' => [__CLASS__, $cb], 'permission_callback' => [__CLASS__, 'can']]);
		};
		$r('/state', 'GET', 'state');
		$r('/upsert', 'POST', 'upsert');
		$r('/status', 'POST', 'status');
		$r('/menu', 'POST', 'menu');
		$r('/options', 'POST', 'options');
		$r('/self-update', 'POST', 'self_update');
		$r('/lock', 'POST', 'lock');
		$r('/purge', 'POST', 'purge');
	}

	static function find_by_key($key) {
		$q = get_posts(['post_type' => ['post', 'page'], 'post_status' => 'any', 'numberposts' => 1, 'meta_key' => self::KEY_META, 'meta_value' => $key, 'fields' => 'ids', 'suppress_filters' => true]);
		return $q ? (int) $q[0] : 0;
	}

	/** Snapshot of the site so the publisher (and Claude, via logs) can see the real state. */
	static function state() {
		$items = [];
		$q = get_posts(['post_type' => ['post', 'page'], 'post_status' => ['publish', 'draft', 'private', 'future', 'pending'], 'numberposts' => -1, 'suppress_filters' => true, 'orderby' => 'ID', 'order' => 'ASC']);
		foreach ($q as $p) {
			$items[] = [
				'id' => $p->ID, 'type' => $p->post_type, 'status' => $p->post_status, 'title' => $p->post_title, 'slug' => $p->post_name,
				'key' => (string) get_post_meta($p->ID, self::KEY_META, true), 'hash' => (string) get_post_meta($p->ID, self::HASH_META, true),
				'date' => $p->post_date, 'modified' => $p->post_modified, 'chars' => mb_strlen(wp_strip_all_tags($p->post_content)), 'link' => get_permalink($p),
			];
		}
		$cats = array_map(function ($t) { return ['id' => $t->term_id, 'name' => $t->name, 'slug' => $t->slug, 'count' => $t->count]; }, get_terms(['taxonomy' => 'category', 'hide_empty' => false]));
		$locations = get_registered_nav_menus();
		$assigned = get_nav_menu_locations();
		$opts = Picklog_Lab_Settings::get();
		return [
			'plugin' => Picklog_Interactive_Lab::VERSION,
			'wp' => get_bloginfo('version'), 'theme' => get_stylesheet(), 'home' => home_url('/'),
			'blogname' => get_option('blogname'), 'blogdescription' => get_option('blogdescription'),
			'show_on_front' => get_option('show_on_front'), 'page_on_front' => (int) get_option('page_on_front'),
			'blog_public' => (int) get_option('blog_public'), 'permalink' => get_option('permalink_structure'),
			'menu_locations' => $locations, 'menu_assigned' => $assigned,
			'categories' => $cats, 'items' => $items,
			'options' => array_map(function ($v) { return is_array($v) ? count($v) : (is_bool($v) ? $v : (string) $v); }, $opts),
			'active_plugins' => get_option('active_plugins'),
			'site_hash' => (string) get_option('picklog_site_hash', ''),
			'now' => current_time('mysql'),
			'cache_probe' => self::cache_probe(),
		];
	}

	static function term_ids($names, $tax) {
		$ids = [];
		foreach ((array) $names as $n) {
			$name = is_array($n) ? ($n['name'] ?? '') : (string) $n;
			$slug = is_array($n) ? ($n['slug'] ?? '') : '';
			if ($name === '') continue;
			$t = $slug ? get_term_by('slug', $slug, $tax) : get_term_by('name', $name, $tax);
			if (!$t) {
				$res = wp_insert_term($name, $tax, $slug ? ['slug' => $slug, 'description' => is_array($n) ? ($n['description'] ?? '') : ''] : []);
				if (is_wp_error($res)) continue;
				$ids[] = (int) $res['term_id'];
			} else {
				if (is_array($n) && !empty($n['description']) && $t->description !== $n['description']) wp_update_term($t->term_id, $tax, ['description' => $n['description']]);
				$ids[] = (int) $t->term_id;
			}
		}
		return $ids;
	}

	static function upsert(WP_REST_Request $req) {
		$d = $req->get_json_params();
		$key = sanitize_key($d['key'] ?? '');
		if (!$key) return new WP_Error('picklog_key', 'key is required', ['status' => 400]);
		$type = in_array($d['type'] ?? 'post', ['post', 'page'], true) ? $d['type'] : 'post';
		$id = self::find_by_key($key);
		if (!$id && !empty($d['target_id'])) { $t = get_post((int) $d['target_id']); if ($t && $t->post_type === $type) $id = $t->ID; }
		$status = in_array($d['status'] ?? 'publish', ['publish', 'draft', 'private', 'future', 'pending'], true) ? $d['status'] : 'publish';
		$arr = [
			'post_type' => $type, 'post_title' => wp_strip_all_tags($d['title'] ?? ''), 'post_content' => (string) ($d['content'] ?? ''),
			'post_excerpt' => (string) ($d['excerpt'] ?? ''), 'post_status' => $status, 'comment_status' => $d['comment_status'] ?? 'closed', 'ping_status' => 'closed',
		];
		if (!empty($d['slug'])) $arr['post_name'] = sanitize_title($d['slug']);
		if (!empty($d['date'])) { $arr['post_date'] = $d['date']; $arr['edit_date'] = true; }
		if (isset($d['menu_order'])) $arr['menu_order'] = (int) $d['menu_order'];
		if (!empty($d['parent_key'])) { $pid = self::find_by_key(sanitize_key($d['parent_key'])); if ($pid) $arr['post_parent'] = $pid; }
		if (get_current_user_id()) $arr['post_author'] = get_current_user_id();
		$action = $id ? 'updated' : 'created';
		if ($id) { $arr['ID'] = $id; if (empty($d['date'])) unset($arr['post_date']); $res = wp_update_post(wp_slash($arr), true); }
		else $res = wp_insert_post(wp_slash($arr), true);
		if (is_wp_error($res)) return $res;
		$id = (int) $res;
		update_post_meta($id, self::KEY_META, $key);
		if (isset($d['hash'])) update_post_meta($id, self::HASH_META, sanitize_text_field($d['hash']));
		if (isset($d['meta_description'])) update_post_meta($id, self::DESC_META, sanitize_text_field($d['meta_description']));
		if ($type === 'post') {
			if (isset($d['categories'])) wp_set_post_terms($id, self::term_ids($d['categories'], 'category'), 'category');
			if (isset($d['tags'])) wp_set_post_terms($id, self::term_ids($d['tags'], 'post_tag'), 'post_tag');
		}
		if (!empty($d['template'])) update_post_meta($id, '_wp_page_template', sanitize_text_field($d['template']));
		if (isset($d['astra_layout'])) { // Astra: full-width content, no sidebar for tool pages
			update_post_meta($id, 'site-sidebar-layout', 'no-sidebar');
			update_post_meta($id, 'site-content-layout', 'page-builder');
			update_post_meta($id, 'ast-site-content-layout', 'full-width-container');
		}
		self::purge_caches($id);
		return ['id' => $id, 'action' => $action, 'link' => get_permalink($id), 'status' => get_post_status($id)];
	}

	/** Change status of existing posts (e.g. hide old off-topic posts). Never touches posts managed by key. */
	static function status(WP_REST_Request $req) {
		$d = $req->get_json_params();
		$status = in_array($d['status'] ?? '', ['private', 'draft', 'publish'], true) ? $d['status'] : '';
		if (!$status) return new WP_Error('picklog_status', 'invalid status', ['status' => 400]);
		$out = [];
		foreach ((array) ($d['ids'] ?? []) as $id) {
			$p = get_post((int) $id);
			if (!$p || !in_array($p->post_type, ['post', 'page'], true)) { $out[] = ['id' => (int) $id, 'result' => 'missing']; continue; }
			if (get_post_meta($p->ID, self::KEY_META, true)) { $out[] = ['id' => $p->ID, 'result' => 'managed-skip']; continue; }
			if ($p->post_status === $status) { $out[] = ['id' => $p->ID, 'result' => 'unchanged']; continue; }
			$r = wp_update_post(['ID' => $p->ID, 'post_status' => $status], true);
			$out[] = ['id' => $p->ID, 'result' => is_wp_error($r) ? $r->get_error_message() : 'ok'];
		}
		return $out;
	}

	static function menu_item_args($it) {
		$a = ['menu-item-title' => $it['title'] ?? '', 'menu-item-status' => 'publish'];
		$type = $it['type'] ?? 'url';
		if ($type === 'key' && ($pid = self::find_by_key(sanitize_key($it['value'])))) {
			$p = get_post($pid);
			$a += ['menu-item-type' => 'post_type', 'menu-item-object' => $p->post_type, 'menu-item-object-id' => $pid];
		} elseif ($type === 'page_id' && ($p = get_post((int) $it['value']))) {
			$a += ['menu-item-type' => 'post_type', 'menu-item-object' => $p->post_type, 'menu-item-object-id' => $p->ID];
		} elseif ($type === 'category' && ($t = get_term_by('slug', $it['value'], 'category'))) {
			$a += ['menu-item-type' => 'taxonomy', 'menu-item-object' => 'category', 'menu-item-object-id' => $t->term_id];
		} else {
			$url = $type === 'home' ? home_url('/') : esc_url_raw($it['value'] ?? '');
			$a += ['menu-item-type' => 'custom', 'menu-item-url' => $url];
		}
		return $a;
	}

	/** Rebuild named classic menus and assign them to theme locations. */
	static function menu(WP_REST_Request $req) {
		$d = $req->get_json_params();
		$result = [];
		$locations = get_theme_mod('nav_menu_locations', []);
		$registered = get_registered_nav_menus();
		foreach ((array) ($d['menus'] ?? []) as $m) {
			$name = sanitize_text_field($m['name'] ?? '');
			if (!$name) continue;
			$obj = wp_get_nav_menu_object($name);
			$menu_id = $obj ? (int) $obj->term_id : (int) wp_create_nav_menu($name);
			if (is_wp_error($menu_id) || !$menu_id) { $result[] = ['menu' => $name, 'error' => 'create failed']; continue; }
			foreach ((array) wp_get_nav_menu_items($menu_id, ['post_status' => 'any']) as $old) wp_delete_post($old->ID, true);
			$add = function ($items, $parent) use (&$add, $menu_id) {
				$n = 0;
				foreach ($items as $it) {
					$args = self::menu_item_args($it) + ['menu-item-parent-id' => $parent];
					$iid = wp_update_nav_menu_item($menu_id, 0, $args);
					$n++;
					if (!is_wp_error($iid) && !empty($it['children'])) $n += $add($it['children'], $iid);
				}
				return $n;
			};
			$count = $add((array) ($m['items'] ?? []), 0);
			$assigned = [];
			foreach ((array) ($m['locations'] ?? []) as $loc) { if (isset($registered[$loc])) { $locations[$loc] = $menu_id; $assigned[] = $loc; } }
			$result[] = ['menu' => $name, 'id' => $menu_id, 'items' => $count, 'locations' => $assigned];
		}
		set_theme_mod('nav_menu_locations', $locations);
		return ['menus' => $result, 'registered' => $registered];
	}

	static function options(WP_REST_Request $req) {
		$d = $req->get_json_params();
		$done = [];
		if (!empty($d['categories'])) { self::term_ids($d['categories'], 'category'); $done[] = 'categories'; }
		if (isset($d['plugin']) && is_array($d['plugin'])) { Picklog_Lab_Settings::update($d['plugin']); $done[] = 'plugin'; }
		$site = $d['site'] ?? [];
		if (!empty($site['prune_empty_categories'])) {
			// Remove leftover categories from the old blog: only ones with no published posts and not listed in site.json.
			$keep = [];
			foreach ((array) ($d['categories'] ?? []) as $c) if (is_array($c) && !empty($c['slug'])) $keep[] = $c['slug'];
			$default = (int) get_option('default_category');
			$removed = [];
			foreach (get_terms(['taxonomy' => 'category', 'hide_empty' => false]) as $t) {
				if ((int) $t->term_id === $default || in_array($t->slug, $keep, true) || (int) $t->count > 0) continue;
				if (!is_wp_error(wp_delete_term($t->term_id, 'category'))) $removed[] = $t->slug;
			}
			$done[] = 'pruned:' . implode(',', $removed);
		}
		if (!empty($site['timezone_string']) && in_array($site['timezone_string'], timezone_identifiers_list(), true)) { update_option('timezone_string', $site['timezone_string']); update_option('gmt_offset', ''); $done[] = 'timezone'; }
		foreach (['blogname', 'blogdescription'] as $k) if (isset($site[$k])) { update_option($k, sanitize_text_field($site[$k])); $done[] = $k; }
		if (isset($site['show_on_front']) && in_array($site['show_on_front'], ['posts', 'page'], true)) { update_option('show_on_front', $site['show_on_front']); $done[] = 'show_on_front'; }
		foreach (['page_on_front', 'page_for_posts'] as $k) {
			if (!empty($site[$k . '_key']) && ($pid = self::find_by_key(sanitize_key($site[$k . '_key'])))) { update_option($k, $pid); $done[] = $k; }
		}
		if (!empty($site['permalink_structure']) && get_option('permalink_structure') !== $site['permalink_structure']) {
			global $wp_rewrite; $wp_rewrite->set_permalink_structure(sanitize_text_field($site['permalink_structure'])); flush_rewrite_rules(); $done[] = 'permalink';
		}
		if (isset($d['hash'])) update_option('picklog_site_hash', sanitize_text_field($d['hash']), false);
		return ['updated' => $done];
	}

	/** Single-run lock for the publisher. add_option() is an atomic INSERT, so only one run can hold it. */
	static function lock(WP_REST_Request $req) {
		$d = $req->get_json_params();
		$owner = sanitize_text_field($d['owner'] ?? '');
		$name = 'picklog_publisher_lock';
		if (($d['action'] ?? '') === 'release') {
			$cur = get_option($name);
			if (is_array($cur) && ($cur['owner'] ?? '') === $owner) delete_option($name);
			return ['released' => true];
		}
		$cur = get_option($name);
		if (is_array($cur) && (time() - (int) ($cur['time'] ?? 0)) > 15 * MINUTE_IN_SECONDS) delete_option($name); // stale
		$ok = add_option($name, ['owner' => $owner, 'time' => time()], '', 'no');
		return ['acquired' => (bool) $ok, 'holder' => $ok ? $owner : (get_option($name)['owner'] ?? '')];
	}

	/** Pull the newest release from GitHub immediately instead of waiting for WP-cron auto-updates. */
	/** 페이지 캐시 비우기: 워드프레스 안에서 비울 수 있는 흔한 캐시 플러그인·서버 캐시를 모두 시도한다(없는 것은 건너뜀). */
	static function purge_caches($post_id = 0) {
		$done = [];
		if ($post_id) { clean_post_cache($post_id); }
		if (function_exists('wp_cache_flush')) { wp_cache_flush(); $done[] = 'object'; }
		if (has_action('litespeed_purge_all') || defined('LSCWP_V')) { do_action('litespeed_purge_all'); $done[] = 'litespeed'; }
		if (function_exists('rocket_clean_domain')) { rocket_clean_domain(); $done[] = 'wp-rocket'; }
		if (function_exists('w3tc_flush_all')) { w3tc_flush_all(); $done[] = 'w3tc'; }
		if (function_exists('wp_cache_clear_cache')) { wp_cache_clear_cache(); $done[] = 'wp-super-cache'; }
		if (function_exists('sg_cachepress_purge_cache')) { sg_cachepress_purge_cache(); $done[] = 'sg'; }
		if (has_action('breeze_clear_all_cache')) { do_action('breeze_clear_all_cache'); $done[] = 'breeze'; }
		if (has_action('rt_nginx_helper_purge_all')) { do_action('rt_nginx_helper_purge_all'); $done[] = 'nginx-helper'; }
		if (class_exists('autoptimizeCache') && method_exists('autoptimizeCache', 'clearall')) { autoptimizeCache::clearall(); $done[] = 'autoptimize'; }
		if (has_action('cloudflare_purge_everything')) { do_action('cloudflare_purge_everything'); $done[] = 'cloudflare'; }
		do_action('picklog_purge_caches');
		return $done;
	}
	static function purge() { return ['purged' => self::purge_caches()]; }

	/** 실제 사이트 화면이 새 버전인지 서버 쪽에서 확인: 캐시 관련 응답 헤더와 히어로 유무(일반 주소 / 캐시를 건너뛰는 주소). */
	static function cache_probe() {
		$out = [];
		foreach (['plain' => home_url('/saju/'), 'bust' => add_query_arg('pkprobe', time(), home_url('/saju/'))] as $k => $url) {
			$r = wp_remote_get($url, ['timeout' => 12, 'sslverify' => false, 'redirection' => 3, 'headers' => ['User-Agent' => 'Mozilla/5.0 (picklog-probe)']]);
			if (is_wp_error($r)) { $out[$k] = ['error' => $r->get_error_message()]; continue; }
			$h = wp_remote_retrieve_headers($r); $body = wp_remote_retrieve_body($r); $hd = [];
			foreach (['server', 'x-cache', 'x-cache-status', 'cf-cache-status', 'x-litespeed-cache', 'x-proxy-cache', 'x-nginx-cache', 'age', 'cache-control', 'x-powered-by', 'x-cache-enabled', 'x-srcache-fetch-status', 'x-hcdn-cache-status'] as $n) {
				if (isset($h[$n])) $hd[$n] = is_array($h[$n]) ? implode(',', $h[$n]) : (string) $h[$n];
			}
			preg_match('/<!--[^>]{0,160}(cache|Cache|rocket|LiteSpeed|Performance)[^>]{0,160}-->/', $body, $m);
			$out[$k] = ['code' => wp_remote_retrieve_response_code($r), 'hero' => strpos($body, 'pk-hero-saju') !== false, 'plugin_ver' => preg_match('/app\.css\?ver=([0-9.]+)/', $body, $v) ? $v[1] : '', 'headers' => $hd, 'comment' => $m[0] ?? ''];
		}
		return $out;
	}

	static function self_update() {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		delete_transient(Picklog_Lab_Updater::CACHE);
		delete_site_transient('update_plugins');
		wp_update_plugins();
		$base = plugin_basename(PICKLOG_LAB_FILE);
		$t = get_site_transient('update_plugins');
		if (empty($t->response[$base])) return ['updated' => false, 'reason' => 'no newer version', 'current' => Picklog_Interactive_Lab::VERSION, 'remote' => Picklog_Lab_Updater::remote()];
		$upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
		$res = $upgrader->upgrade($base);
		// keep the plugin active without re-including this file in the current request
		$active = (array) get_option('active_plugins', []);
		if (!in_array($base, $active, true)) { $active[] = $base; update_option('active_plugins', array_values($active)); }
		return ['updated' => $res === true, 'result' => is_wp_error($res) ? $res->get_error_message() : $res, 'to' => $t->response[$base]->new_version, 'messages' => $upgrader->skin->get_upgrade_messages()];
	}
}
