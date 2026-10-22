<?php
/**
 * Self-updater: reads dist/plugin.json from the public GitHub repository and offers the update to WordPress.
 * Auto-updates are enabled for this plugin only.
 */
if (!defined('ABSPATH')) exit;

final class Picklog_Lab_Updater {
	const MANIFEST = 'https://raw.githubusercontent.com/mcc-cmd/picklog-automation/main/dist/plugin.json';
	const CACHE = 'picklog_lab_remote_manifest';

	static function init() {
		add_filter('pre_set_site_transient_update_plugins', [__CLASS__, 'inject']);
		add_filter('auto_update_plugin', [__CLASS__, 'auto'], 20, 2);
		add_filter('plugins_api', [__CLASS__, 'info'], 20, 3);
	}

	static function remote() {
		$m = get_transient(self::CACHE);
		if ($m === false) {
			$r = wp_remote_get(self::MANIFEST . '?t=' . time(), ['timeout' => 10, 'headers' => ['Cache-Control' => 'no-cache']]);
			$m = (!is_wp_error($r) && wp_remote_retrieve_response_code($r) === 200) ? json_decode(wp_remote_retrieve_body($r), true) : null;
			set_transient(self::CACHE, $m ?: [], $m ? 3 * HOUR_IN_SECONDS : 30 * MINUTE_IN_SECONDS);
		}
		return is_array($m) && !empty($m['version']) && !empty($m['package']) ? $m : null;
	}

	static function inject($transient) {
		if (!is_object($transient)) return $transient;
		$m = self::remote();
		$base = plugin_basename(PICKLOG_LAB_FILE);
		$item = (object) ['id' => 'github.com/mcc-cmd/picklog-automation', 'slug' => 'picklog-interactive-lab', 'plugin' => $base,
			'new_version' => $m ? $m['version'] : Picklog_Interactive_Lab::VERSION, 'url' => 'https://github.com/mcc-cmd/picklog-automation', 'package' => $m ? $m['package'] : '', 'requires_php' => '7.4'];
		if ($m && version_compare($m['version'], Picklog_Interactive_Lab::VERSION, '>')) $transient->response[$base] = $item;
		else { unset($transient->response[$base]); $transient->no_update[$base] = $item; }
		return $transient;
	}

	static function auto($update, $item) {
		return (isset($item->plugin) && $item->plugin === plugin_basename(PICKLOG_LAB_FILE)) ? true : $update;
	}

	static function info($res, $action, $args) {
		if ($action !== 'plugin_information' || ($args->slug ?? '') !== 'picklog-interactive-lab') return $res;
		$m = self::remote();
		return (object) ['name' => 'PICKLOG Interactive Lab', 'slug' => 'picklog-interactive-lab', 'version' => $m['version'] ?? Picklog_Interactive_Lab::VERSION,
			'author' => 'PICKLOG', 'homepage' => 'https://github.com/mcc-cmd/picklog-automation', 'download_link' => $m['package'] ?? '',
			'sections' => ['changelog' => esc_html($m['changelog'] ?? '')]];
	}
}
