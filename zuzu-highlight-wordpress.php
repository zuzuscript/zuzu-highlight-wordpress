<?php
/**
 * Plugin Name: Zuzu Highlight
 * Plugin URI: https://zuzulang.org/
 * Description: Adds ZuzuScript syntax highlighting to <pre class="zuzu-highlight"> blocks.
 * Version: 0.7.0
 * Author: Toby Inkster
 * License: MIT
 * Text Domain: zuzu-highlight
 *
 * @package ZuzuHighlight
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const ZUZU_HIGHLIGHT_OPTION_MODE = 'zuzu_highlight_theme_mode';
const ZUZU_HIGHLIGHT_MODE_AUTO   = 'auto';
const ZUZU_HIGHLIGHT_MODE_DARK   = 'dark';
const ZUZU_HIGHLIGHT_MODE_LIGHT  = 'light';

add_action( 'wp_enqueue_scripts', 'zuzu_highlight_enqueue_script' );
add_action( 'admin_init', 'zuzu_highlight_register_settings' );
add_action( 'admin_menu', 'zuzu_highlight_add_hidden_options_page' );
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'zuzu_highlight_plugin_action_links' );

/**
 * Enqueue the browser highlighter and theme override styles on public pages.
 */
function zuzu_highlight_enqueue_script(): void {
	$asset_dir = plugin_dir_path( __FILE__ ) . 'assets/';
	$asset_url = plugin_dir_url( __FILE__ ) . 'assets/';

	$style_path    = $asset_dir . 'zuzu-highlight-theme.css';
	$style_version = file_exists( $style_path ) ? (string) filemtime( $style_path ) : '0.1.0';

	wp_enqueue_style(
		'zuzu-highlight-theme',
		$asset_url . 'zuzu-highlight-theme.css',
		array(),
		$style_version
	);

	$forced_styles = zuzu_highlight_forced_theme_styles();
	if ( '' !== $forced_styles ) {
		wp_add_inline_style( 'zuzu-highlight-theme', $forced_styles );
	}

	$script_path    = $asset_dir . 'zuzu-highlight.js';
	$script_version = file_exists( $script_path ) ? (string) filemtime( $script_path ) : '0.1.0';

	wp_enqueue_script(
		'zuzu-highlight',
		$asset_url . 'zuzu-highlight.js',
		array(),
		$script_version,
		true
	);
}

/**
 * Register plugin settings.
 */
function zuzu_highlight_register_settings(): void {
	register_setting(
		'zuzu_highlight',
		ZUZU_HIGHLIGHT_OPTION_MODE,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'zuzu_highlight_sanitize_theme_mode',
			'default'           => ZUZU_HIGHLIGHT_MODE_AUTO,
		)
	);

	add_settings_section(
		'zuzu_highlight_theme_section',
		__( 'Theme', 'zuzu-highlight' ),
		'__return_false',
		'zuzu-highlight'
	);

	add_settings_field(
		ZUZU_HIGHLIGHT_OPTION_MODE,
		__( 'Rendering mode', 'zuzu-highlight' ),
		'zuzu_highlight_render_mode_field',
		'zuzu-highlight',
		'zuzu_highlight_theme_section'
	);
}

/**
 * Add the plugin options page without placing it in the main Settings menu.
 */
function zuzu_highlight_add_hidden_options_page(): void {
	add_submenu_page(
		'plugins.php',
		__( 'Zuzu Highlight', 'zuzu-highlight' ),
		__( 'Zuzu Highlight', 'zuzu-highlight' ),
		'manage_options',
		'zuzu-highlight',
		'zuzu_highlight_render_options_page'
	);
	remove_submenu_page( 'plugins.php', 'zuzu-highlight' );
}

/**
 * Add a settings link to the plugin row on the Installed Plugins page.
 *
 * @param array<int|string, string> $links Existing plugin action links.
 * @return array<int|string, string>
 */
function zuzu_highlight_plugin_action_links( array $links ): array {
	$settings_link = sprintf(
		'<a href="%s">%s</a>',
		esc_url( admin_url( 'plugins.php?page=zuzu-highlight' ) ),
		esc_html__( 'Settings', 'zuzu-highlight' )
	);

	array_unshift( $links, $settings_link );
	return $links;
}

/**
 * Render the plugin options page.
 */
function zuzu_highlight_render_options_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<form action="options.php" method="post">
			<?php
			settings_fields( 'zuzu_highlight' );
			do_settings_sections( 'zuzu-highlight' );
			submit_button();
			?>
		</form>
	</div>
	<?php
}

/**
 * Render the rendering mode field.
 */
function zuzu_highlight_render_mode_field(): void {
	$current = zuzu_highlight_theme_mode();
	$options = array(
		ZUZU_HIGHLIGHT_MODE_AUTO  => __( 'Follow the visitor colour scheme', 'zuzu-highlight' ),
		ZUZU_HIGHLIGHT_MODE_DARK  => __( 'Always dark mode', 'zuzu-highlight' ),
		ZUZU_HIGHLIGHT_MODE_LIGHT => __( 'Always light mode', 'zuzu-highlight' ),
	);
	?>
	<select name="<?php echo esc_attr( ZUZU_HIGHLIGHT_OPTION_MODE ); ?>">
		<?php foreach ( $options as $value => $label ) : ?>
			<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $current, $value ); ?>>
				<?php echo esc_html( $label ); ?>
			</option>
		<?php endforeach; ?>
	</select>
	<?php
}

/**
 * Sanitize the selected rendering mode.
 *
 * @param mixed $value Submitted setting value.
 */
function zuzu_highlight_sanitize_theme_mode( $value ): string {
	$value = is_string( $value ) ? $value : ZUZU_HIGHLIGHT_MODE_AUTO;
	if ( in_array( $value, zuzu_highlight_theme_modes(), true ) ) {
		return $value;
	}
	return ZUZU_HIGHLIGHT_MODE_AUTO;
}

/**
 * Return the current rendering mode.
 */
function zuzu_highlight_theme_mode(): string {
	return zuzu_highlight_sanitize_theme_mode(
		get_option( ZUZU_HIGHLIGHT_OPTION_MODE, ZUZU_HIGHLIGHT_MODE_AUTO )
	);
}

/**
 * Return valid rendering modes.
 *
 * @return list<string>
 */
function zuzu_highlight_theme_modes(): array {
	return array(
		ZUZU_HIGHLIGHT_MODE_AUTO,
		ZUZU_HIGHLIGHT_MODE_DARK,
		ZUZU_HIGHLIGHT_MODE_LIGHT,
	);
}

/**
 * Return inline variable overrides for forced light or dark modes.
 */
function zuzu_highlight_forced_theme_styles(): string {
	$mode = zuzu_highlight_theme_mode();
	if ( ZUZU_HIGHLIGHT_MODE_DARK === $mode ) {
		return zuzu_highlight_dark_variables();
	}
	if ( ZUZU_HIGHLIGHT_MODE_LIGHT === $mode ) {
		return zuzu_highlight_light_variables();
	}
	return '';
}

/**
 * Light mode CSS variables matching Zuzulang.org.
 */
function zuzu_highlight_light_variables(): string {
	return ':root{' .
		'color-scheme:light;' .
		'--z-code-bg:#edf1f7;' .
		'--z-code-text:#172033;' .
		'--z-code-keyword:#7c4d00;' .
		'--z-code-string:#0f766e;' .
		'--z-code-literal:#9a3412;' .
		'--z-code-number:#9a3412;' .
		'--z-code-comment:#64748b;' .
		'--z-code-operator:#0369a1;' .
		'--z-code-punct:#6d28d9;' .
		'--z-code-ident:#172033;' .
		'}';
}

/**
 * Dark mode CSS variables matching Zuzulang.org.
 */
function zuzu_highlight_dark_variables(): string {
	return ':root{' .
		'color-scheme:dark;' .
		'--z-code-bg:#1f2430;' .
		'--z-code-text:#d9dde7;' .
		'--z-code-keyword:#ffcc66;' .
		'--z-code-string:#95e6cb;' .
		'--z-code-literal:#f29e74;' .
		'--z-code-number:#f29e74;' .
		'--z-code-comment:#7f8997;' .
		'--z-code-operator:#89ddff;' .
		'--z-code-punct:#c3a6ff;' .
		'--z-code-ident:#d9dde7;' .
		'}';
}
