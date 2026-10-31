<?php
/**
 * Plugin Name: PICKLOG Interactive Lab
 * Description: IPIP 기반 심리테스트, 정밀 만세력 사주·운세, 사주 궁합. 숏코드: [picklog_interactive], [picklog_interactive test="love"], [picklog_fortune], [picklog_compatibility], [picklog_ipip50]
 * Version: 2.4.0
 * Requires PHP: 7.4
 * Text Domain: picklog-interactive
 */
if (!defined('ABSPATH')) exit;
define('PICKLOG_LAB_FILE', __FILE__);
require_once __DIR__ . '/includes/settings.php';
require_once __DIR__ . '/includes/rest.php';
require_once __DIR__ . '/includes/updater.php';

final class Picklog_Interactive_Lab {
	const VERSION = '2.4.0';
	const SHORTCODES = ['picklog_interactive', 'picklog_personality', 'picklog_ipip50', 'picklog_fortune', 'picklog_saju', 'picklog_compatibility', 'picklog_ttibti'];
	const TESTS = ['saju', 'compat', 'type', 'bigfive', 'love', 'relation', 'work', 'money', 'stress', 'career', 'animal'];

	static function init() {
		add_shortcode('picklog_interactive', [__CLASS__, 'render']);
		add_shortcode('picklog_personality', [__CLASS__, 'personality']);
		add_shortcode('picklog_ipip50', [__CLASS__, 'personality']);
		add_shortcode('picklog_fortune', [__CLASS__, 'fortune']);
		add_shortcode('picklog_saju', [__CLASS__, 'fortune']);
		add_shortcode('picklog_compatibility', [__CLASS__, 'compatibility']);
		add_shortcode('picklog_latest', [__CLASS__, 'latest']);
		add_shortcode('picklog_ttibti', [__CLASS__, 'ttibti']);
		add_shortcode('picklog_hero', [__CLASS__, 'hero']);
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
		wp_register_script('picklog-ttibti', $u . 'ttibti.js', [], self::VERSION, true);
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
	/** 페이지 맨 위 그림 히어로. [picklog_hero key="home|saju|gunghap|bigfive"] — 테마 제목·앱 머리글은 CSS로 숨기고 이 h1이 대신한다 */
	static function hero($atts) {
		$a = shortcode_atts(['key' => 'home'], $atts);
		if (!wp_style_is('picklog-il', 'registered')) self::register();
		wp_enqueue_style('picklog-il');
		$u = plugins_url('assets/', __FILE__);
		$m = (int) wp_date('n');
		$season = $m >= 3 && $m <= 5 ? 'spring' : ($m >= 6 && $m <= 8 ? 'summer' : ($m >= 9 && $m <= 11 ? 'autumn' : 'winter'));
		$H = [
			'home' => ['tone' => 'home', 'pill' => '사주 · 운세 · 성격검사 · 띠비티아이', 'title' => '나를 알아가는<br><mark>가장 재밌는</mark> 방법',
				'sub' => '정밀 만세력 사주부터 국제 공개 문항(IPIP) 성격검사까지. 회원가입 없이 무료로, 3분이면 결과가 나와요.',
				'chips' => ['무료 사주', '사주 궁합', 'Big Five', '연애·관계 테스트'], 'imgs' => ['card-saju.webp', 'card-type.webp', 'card-compat.webp']],
			'saju' => ['tone' => 'saju', 'pill' => '정밀 만세력 · 절입 시각 분 단위 반영', 'title' => '<mark>무료</mark> 사주 풀이<br>& 오늘의 운세',
				'sub' => '생년월일시로 사주 원국을 세우고 오늘·이번 달·올해 운세와 10년 대운까지 풀어 드려요. 음력·윤달도 그대로 입력하세요.',
				'chips' => ['오늘의 운세', '올해 운세', '10년 대운', '음력·윤달'], 'imgs' => ['saju-hero-' . $season . '.webp']],
			'gunghap' => ['tone' => 'gunghap', 'pill' => '일간 · 일지 · 띠 · 오행 비교', 'title' => '우리 둘<br><mark>사주 궁합</mark>',
				'sub' => '두 사람의 생년월일만 넣으면 전통 명리학의 다섯 가지 관계를 한 번에 비교해요. 상대 정보는 저장하지 않아요.',
				'chips' => ['천간합', '육합·삼합', '충·원진', '오행 보완'], 'imgs' => ['card-compat.webp', 'card-love.webp']],
			'bigfive' => ['tone' => 'bigfive', 'pill' => 'IPIP 50문항 · 약 7~10분', 'title' => '<mark>Big Five</mark><br>성격검사',
				'sub' => '심리학에서 가장 널리 쓰는 성격 5요인을 0~100점으로 보여 줘요. 연구용 공개 문항(Goldberg, 1992)을 한국어로 옮겼어요.',
				'chips' => ['외향성', '친화성', '성실성', '정서 안정성', '개방성'], 'imgs' => ['card-bigfive.webp', 'card-work.webp']],
		];
		$h = $H[$a['key']] ?? $H['home'];
		$imgs = '';
		foreach ($h['imgs'] as $i => $f) {
			$imgs .= '<img class="pk-hero-img pk-hero-img' . ($i + 1) . '" src="' . esc_url($u . $f) . '" alt="" width="800" height="400"' . ($i ? ' loading="lazy"' : ' fetchpriority="high"') . ' decoding="async">';
		}
		$chips = '';
		foreach ($h['chips'] as $c) $chips .= '<span>' . esc_html($c) . '</span>';
		return '<div class="pil-app pk-hero-wrap"><section class="pk-hero pk-hero-' . esc_attr($h['tone']) . ' pk-hero-n' . count($h['imgs']) . '"><div class="pk-hero-text">'
			. '<p class="pk-hero-pill">' . esc_html($h['pill']) . '</p><h1 class="pk-hero-title">' . wp_kses($h['title'], ['br' => [], 'mark' => []]) . '</h1>'
			. '<p class="pk-hero-sub">' . esc_html($h['sub']) . '</p><p class="pk-hero-chips">' . $chips . '</p></div>'
			. '<div class="pk-hero-art">' . $imgs . '</div></section></div>';
	}
	/** 띠비티아이: 태어난 해(+달·일) × MBTI 재미 풀이. [picklog_ttibti] — 계산은 브라우저에서만, 저장하지 않음 */
	static function ttibti() {
		if (!wp_script_is('picklog-ttibti', 'registered')) self::register();
		wp_enqueue_style('picklog-il');
		wp_enqueue_script('picklog-ttibti');
		return '<div class="pil-app"><div class="pil-ttibti" data-base="' . esc_attr(plugins_url('assets/', __FILE__)) . '"><p class="pil-loading">콘텐츠를 불러오는 중입니다…</p></div></div>';
	}
}
Picklog_Interactive_Lab::init();
