<?php
/**
 * Plugin Name: Zuzu Highlight
 * Plugin URI: https://zuzulang.org/
 * Description: Adds ZuzuScript syntax highlighting to <pre class="zuzu-highlight"> blocks.
 * Version: 0.1.0
 * Author: Toby Inkster
 * License: MIT
 * Text Domain: zuzu-highlight
 *
 * @package ZuzuHighlight
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_enqueue_scripts', 'zuzu_highlight_enqueue_script' );

/**
 * Enqueue the self-contained browser highlighter on public pages.
 */
function zuzu_highlight_enqueue_script(): void {
	$script_path = plugin_dir_path( __FILE__ ) . 'assets/zuzu-highlight.js';
	$script_url  = plugin_dir_url( __FILE__ ) . 'assets/zuzu-highlight.js';
	$version     = file_exists( $script_path ) ? (string) filemtime( $script_path ) : '0.1.0';

	wp_enqueue_script(
		'zuzu-highlight',
		$script_url,
		array(),
		$version,
		true
	);
}
