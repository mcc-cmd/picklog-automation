<?php
/**
 * Site-level settings: AdSense, ads.txt, search-engine verification, Coupang Partners, SEO meta.
 * Values are managed by the publisher through /picklog/v1/options, and can be checked under 설정 → PICKLOG.
 */
if (!defined('ABSPATH')) exit;

final class Picklog_Lab_Settings {
	const OPT = 'picklog_lab_options';
	const DEFAULTS = [
		'adsense_client' => '',        // ca-pub-XXXXXXXXXXXXXXXX
		'adsense_head' => true,        // print the AdSense loader in <head> when a client id exists (needed for review & auto ads)
		'adsense_slot_result' => '',   // in-content slot id for test/fortune results (optional)
		'google_verification' => '',   // Search Console HTML-tag token
		'naver_verification' => '',    // 네이버 서치어드바이저 token
		'ga4_id' => '',                // G-XXXXXXX (optional)
		'coupang_enabled' => false,
		'coupang_links' => [],         // key => url (e.g. el-0 .. el-4, love, money, stress)
		'seo_meta' => true,            // meta description / OG / JSON-LD when no SEO plugin is active
	];

	static function init() {
		add_action('wp_head', [__CLASS__, 'head'], 1);
		add_action('init', [__CLASS__, 'ads_txt'], 0);
		add_action('admin_menu', [__CLASS__, 'admin_menu']);
	}

	static function get() { return array_merge(self::DEFAULTS, (array) get_option(self::OPT, [])); }

	static function update($in) {
		$o = self::get();
		foreach ($in as $k => $v) {
			if (!array_key_exists($k, self::DEFAULTS)) continue;
			if (is_bool(self::DEFAULTS[$k])) $o[$k] = (bool) $v;
			elseif (is_array(self::DEFAULTS[$k])) $o[$k] = array_map('esc_url_raw', array_filter((array) $v, 'is_string'));
			else $o[$k] = sanitize_text_field((string) $v);
		}
		if ($o['adsense_client'] && !preg_match('/^ca-pub-\d{10,20}$/', $o['adsense_client'])) $o['adsense_client'] = '';
		update_option(self::OPT, $o, true);
		return $o;
	}

	static function seo_plugin_active() {
		return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION');
	}

	static function head() {
		$o = self::get();
		if ($o['google_verification']) echo '<meta name="google-site-verification" content="' . esc_attr($o['google_verification']) . "\" />\n";
		if ($o['naver_verification']) echo '<meta name="naver-site-verification" content="' . esc_attr($o['naver_verification']) . "\" />\n";
		if ($o['adsense_client'] && $o['adsense_head']) {
			echo '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' . esc_attr($o['adsense_client']) . '" crossorigin="anonymous"></script>' . "\n";
		}
		if ($o['ga4_id'] && preg_match('/^G-[A-Z0-9]+$/', $o['ga4_id'])) {
			$id = esc_js($o['ga4_id']);
			echo "<script async src=\"https://www.googletagmanager.com/gtag/js?id={$id}\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{$id}');</script>\n";
		}
		if (!$o['seo_meta'] || self::seo_plugin_active() || !is_singular()) {
			if ($o['seo_meta'] && !self::seo_plugin_active() && (is_front_page() || is_home())) {
				echo '<meta name="description" content="' . esc_attr(get_bloginfo('description')) . "\" />\n";
			}
			return;
		}
		$post = get_queried_object();
		if (!$post instanceof WP_Post) return;
		$desc = get_post_meta($post->ID, Picklog_Lab_REST::DESC_META, true);
		if (!$desc) $desc = has_excerpt($post) ? get_the_excerpt($post) : wp_trim_words(wp_strip_all_tags(strip_shortcodes($post->post_content)), 40, '…');
		$desc = trim(preg_replace('/\s+/', ' ', $desc));
		$title = get_the_title($post);
		$url = get_permalink($post);
		$img = get_the_post_thumbnail_url($post, 'large');
		echo '<meta name="description" content="' . esc_attr(mb_substr($desc, 0, 160)) . "\" />\n";
		echo '<meta property="og:type" content="' . ($post->post_type === 'post' ? 'article' : 'website') . "\" />\n";
		echo '<meta property="og:title" content="' . esc_attr($title) . "\" />\n";
		echo '<meta property="og:description" content="' . esc_attr(mb_substr($desc, 0, 160)) . "\" />\n";
		echo '<meta property="og:url" content="' . esc_url($url) . "\" />\n";
		echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . "\" />\n";
		if ($img) echo '<meta property="og:image" content="' . esc_url($img) . "\" />\n";
		if ($post->post_type === 'post') {
			$ld = ['@context' => 'https://schema.org', '@type' => 'Article', 'headline' => $title, 'description' => mb_substr($desc, 0, 160),
				'datePublished' => get_the_date('c', $post), 'dateModified' => get_the_modified_date('c', $post), 'mainEntityOfPage' => $url,
				'author' => ['@type' => 'Organization', 'name' => get_bloginfo('name'), 'url' => home_url('/')],
				'publisher' => ['@type' => 'Organization', 'name' => get_bloginfo('name')]];
			if ($img) $ld['image'] = $img;
			echo '<script type="application/ld+json">' . wp_json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "</script>\n";
		}
	}

	/** Serve /ads.txt from the AdSense publisher id (no file upload needed). */
	static function ads_txt() {
		$path = isset($_SERVER['REQUEST_URI']) ? strtok(wp_unslash($_SERVER['REQUEST_URI']), '?') : '';
		if ($path !== '/ads.txt') return;
		$o = self::get();
		if (!$o['adsense_client']) return;
		header('Content-Type: text/plain; charset=utf-8');
		echo 'google.com, ' . str_replace('ca-', '', $o['adsense_client']) . ", DIRECT, f08c47fec0942fa0\n";
		exit;
	}

	static function admin_menu() {
		add_options_page('PICKLOG', 'PICKLOG', 'manage_options', 'picklog-lab', [__CLASS__, 'page']);
	}

	static function page() {
		if (!current_user_can('manage_options')) return;
		if (isset($_POST['picklog_save']) && check_admin_referer('picklog_lab_settings')) {
			$in = wp_unslash($_POST['picklog'] ?? []);
			foreach (['adsense_head', 'coupang_enabled', 'seo_meta'] as $b) $in[$b] = !empty($in[$b]);
			self::update($in);
			echo '<div class="updated"><p>저장했습니다.</p></div>';
		}
		$o = self::get();
		$m = Picklog_Lab_Updater::remote();
		echo '<div class="wrap"><h1>PICKLOG 설정</h1>';
		echo '<p>플러그인 버전 <strong>' . esc_html(Picklog_Interactive_Lab::VERSION) . '</strong> · GitHub 최신 버전 <strong>' . esc_html($m['version'] ?? '확인 불가') . '</strong> (자동 업데이트 켜짐)</p>';
		echo '<form method="post">';
		wp_nonce_field('picklog_lab_settings');
		$text = function ($k, $label, $ph = '') use ($o) { echo '<tr><th><label>' . esc_html($label) . '</label></th><td><input class="regular-text" name="picklog[' . esc_attr($k) . ']" value="' . esc_attr($o[$k]) . '" placeholder="' . esc_attr($ph) . '"></td></tr>'; };
		$check = function ($k, $label) use ($o) { echo '<tr><th>' . esc_html($label) . '</th><td><label><input type="checkbox" name="picklog[' . esc_attr($k) . ']" value="1" ' . checked($o[$k], true, false) . '> 사용</label></td></tr>'; };
		echo '<table class="form-table">';
		$text('adsense_client', '애드센스 게시자 ID', 'ca-pub-0000000000000000');
		$check('adsense_head', '애드센스 코드 삽입');
		$text('adsense_slot_result', '결과 화면 광고 슬롯 ID', '1234567890');
		$text('google_verification', '구글 서치콘솔 인증 코드');
		$text('naver_verification', '네이버 서치어드바이저 인증 코드');
		$text('ga4_id', 'GA4 측정 ID', 'G-XXXXXXX');
		$check('coupang_enabled', '쿠팡 파트너스 추천 상자');
		$check('seo_meta', '메타 설명·OG·구조화 데이터 출력');
		echo '</table><p class="description">이 값들은 자동 발행기가 관리합니다. 직접 바꾼 값은 다음 자동 실행 때 저장소 설정으로 덮어쓸 수 있습니다.</p>';
		submit_button('저장', 'primary', 'picklog_save');
		echo '</form></div>';
	}

	/** Public, non-secret settings for the front-end scripts. */
	static function front_config() {
		$o = self::get();
		return [
			'ads' => ['client' => $o['adsense_client'], 'slot' => $o['adsense_slot_result']],
			'coupang' => $o['coupang_enabled'] ? $o['coupang_links'] : new stdClass(),
		];
	}
}
