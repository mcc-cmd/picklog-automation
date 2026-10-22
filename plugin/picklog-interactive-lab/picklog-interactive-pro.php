<?php
/**
 * Plugin Name: PICKLOG Interactive Lab
 * Description: IPIP 기반 심리테스트, 정밀 만세력 사주·운세, 사주 궁합. 숏코드: [picklog_interactive], [picklog_interactive test="love"], [picklog_fortune], [picklog_compatibility], [picklog_ipip50]
 * Version: 2.1.0
 * Requires PHP: 7.4
 * Text Domain: picklog-interactive
 */
if (!defined('ABSPATH')) exit;
define('PICKLOG_LAB_FILE', __FILE__);
require_once __DIR__ . '/includes/settings.php';
require_once __DIR__ . '/includes/rest.php';
require_once __DIR__ . '/includes/updater.php';

final class Picklog_Interactive_Lab {
	const VERSION = '2.1.0';
	const SHORTCODES = ['picklog_interactive', 'picklog_personality', 'picklog_ipip50', 'picklog_fortune', 'picklog_saju', 'picklog_compatibility'];
	const TESTS = ['saju', 'compat', 'type', 'bigfive', 'love', 'relation', 'work', 'money', 'stress', 'career', 'animal'];

	static function init() {
		add_shortcode('picklog_interactive', [__CLASS__, 'render']);
		add_shortcode('picklog_personality', [__CLASS__, 'personality']);
		add_shortcode('picklog_ipip50', [__CLASS__, 'personality']);
		add_shortcode('picklog_fortune', [__CLASS__, 'fortune']);
		add_shortcode('picklog_saju', [__CLASS__, 'fortune']);
		add_shortcode('picklog_compatibility', [__CLASS__, 'compatibility']);
		add_shortcode('picklog_latest', [__CLASS__, 'latest']);
		add_action('wp_enqueue_scripts', [__CLASS__, 'register']);
		add_filter('body_class', [__CLASS__, 'body_class']);
		add_filter('comments_open', [__CLASS__, 'disable_comments'], 20, 2);
		add_filter('pings_open', [__CLASS__, 'disable_comments'], 20, 2);
		Picklog_Lab_Settings::init();
		Picklog_Lab_REST::init();
		Picklog_Lab_Updater::init();
	}

	static function is_test_page($post_id = 0) {
		$post = $post_id ? get_post($post_id) : get_queried_object();
		if (!$post instanceof WP_Post) return false;
		if ($post->post_type !== 'post' && $post->post_type !== 'page') return false;
		foreach (self::SHORTCODES as $sc) if (has_shortcode($post->post_content, $sc)) return true;
		return false;
	}
	static function body_class($classes) { if (is_singular() && self::is_test_page()) $classes[] = 'picklog-test-page'; return $classes; }
	static function disable_comments($open, $post_id) { return self::is_test_page($post_id) ? false : $open; }

	static function register() {
		$u = plugins_url('assets/', __FILE__);
		wp_register_style('picklog-il', $u . 'app.css', [], self::VERSION);
		wp_register_script('picklog-saju-core', $u . 'saju-core.js', [], self::VERSION, true);
		wp_register_script('picklog-fortune', $u . 'fortune.js', ['picklog-saju-core'], self::VERSION, true);
		wp_register_script('picklog-ipip', $u . 'ipip.js', [], self::VERSION, true);
		wp_register_script('picklog-il', $u . 'app.js', ['picklog-ipip', 'picklog-fortune'], self::VERSION, true);
	}

	static function mount($mode, $test = '') {
		static $inlined = false;
		if (!wp_script_is('picklog-il', 'registered')) self::register(); // block themes render content before wp_enqueue_scripts
		wp_enqueue_style('picklog-il');
		wp_enqueue_script('picklog-il');
		if (!$inlined) {
			$u = plugins_url('assets/', __FILE__);
			wp_add_inline_script('picklog-saju-core', 'window.PicklogIllustrationBase=' . wp_json_encode($u) . ';window.PicklogSajuData=' . wp_json_encode(['terms' => $u . 'solar-terms.json?v=' . self::VERSION, 'calendar' => $u . 'saju-data.json?v=' . self::VERSION]) . ';window.PicklogConfig=' . wp_json_encode(Picklog_Lab_Settings::front_config()) . ';', 'before');
			$inlined = true;
		}
		$test = in_array($test, self::TESTS, true) ? $test : '';
		return '<div class="pil-app" data-mode="' . esc_attr($mode) . '" data-test="' . esc_attr($test) . '" data-version="' . esc_attr(self::VERSION) . '"><p class="pil-loading">콘텐츠를 불러오는 중입니다…</p></div>';
	}
	static function render($atts = []) { $a = shortcode_atts(['test' => ''], $atts); return self::mount('all', sanitize_key($a['test'])); }
	static function personality() { return self::mount('personality'); }

	/** Server-rendered list of recent posts: [picklog_latest category="saju-guide" count="6" title="..."] */
	static function latest($atts = []) {
		$a = shortcode_atts(['category' => '', 'count' => 6, 'title' => ''], $atts);
		$q = new WP_Query(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => max(1, min(24, (int) $a['count'])), 'category_name' => sanitize_title($a['category']), 'ignore_sticky_posts' => true, 'no_found_rows' => true]);
		if (!$q->have_posts()) return '';
		wp_enqueue_style('picklog-il');
		$h = '<section class="pil-latest">' . ($a['title'] ? '<h2 class="pil-latest-title">' . esc_html($a['title']) . '</h2>' : '') . '<ul class="pil-latest-list">';
		foreach ($q->posts as $p) {
			$cats = get_the_category($p->ID);
			$h .= '<li><a href="' . esc_url(get_permalink($p)) . '"><span class="pil-latest-cat">' . esc_html($cats ? $cats[0]->name : '') . '</span><strong>' . esc_html(get_the_title($p)) . '</strong><span class="pil-latest-ex">' . esc_html(wp_trim_words(get_the_excerpt($p), 28, '…')) . '</span></a></li>';
		}
		return $h . '</ul></section>';
	}
	static function fortune() { return self::mount('fortune'); }
	static function compatibility() { return self::mount('compatibility'); }
}
Picklog_Interactive_Lab::init();
