<?php
/**
 * ShelfSage author profile enhancements.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Social link fields stored on rmss_author terms.
 *
 * @return array
 */
function trsss_author_profile_social_fields() {
	return array(
		'website'   => __( 'Website', 'shelfsage' ),
		'facebook'  => __( 'Facebook', 'shelfsage' ),
		'twitter'   => __( 'X / Twitter', 'shelfsage' ),
		'instagram' => __( 'Instagram', 'shelfsage' ),
		'linkedin'  => __( 'LinkedIn', 'shelfsage' ),
		'youtube'   => __( 'YouTube', 'shelfsage' ),
	);
}

/**
 * Render social fields on the add author form.
 *
 * @return void
 */
function trsss_author_profile_add_social_fields() {
	wp_nonce_field( 'trsss_author_profile_socials', 'trsss_author_profile_socials_nonce' );
	?>
	<div class="form-field trsss-author-profile-socials">
		<label><?php esc_html_e( 'Author Social Links', 'shelfsage' ); ?></label>
		<p><?php esc_html_e( 'Optional links for the author profile page.', 'shelfsage' ); ?></p>
		<?php foreach ( trsss_author_profile_social_fields() as $key => $label ) : ?>
			<label for="trsss_author_<?php echo esc_attr( $key ); ?>" style="font-weight:600;margin-top:8px;"><?php echo esc_html( $label ); ?></label>
			<input type="url" name="trsss_author_socials[<?php echo esc_attr( $key ); ?>]" id="trsss_author_<?php echo esc_attr( $key ); ?>" value="" placeholder="https://" />
		<?php endforeach; ?>
	</div>
	<?php
}
add_action( 'rmss_author_add_form_fields', 'trsss_author_profile_add_social_fields', 30 );

/**
 * Render social fields on the edit author form.
 *
 * @param WP_Term $term Author term.
 * @return void
 */
function trsss_author_profile_edit_social_fields( $term ) {
	$socials = get_term_meta( $term->term_id, 'trsss_author_socials', true );
	$socials = is_array( $socials ) ? $socials : array();
	?>
	<tr class="form-field trsss-author-profile-socials">
		<th scope="row"><label><?php esc_html_e( 'Author Social Links', 'shelfsage' ); ?></label></th>
		<td>
			<?php wp_nonce_field( 'trsss_author_profile_socials', 'trsss_author_profile_socials_nonce' ); ?>
			<p class="description"><?php esc_html_e( 'Optional links shown on the author profile page.', 'shelfsage' ); ?></p>
			<?php foreach ( trsss_author_profile_social_fields() as $key => $label ) : ?>
				<label for="trsss_author_<?php echo esc_attr( $key ); ?>" style="display:block;font-weight:600;margin-top:10px;"><?php echo esc_html( $label ); ?></label>
				<input type="url" class="regular-text" name="trsss_author_socials[<?php echo esc_attr( $key ); ?>]" id="trsss_author_<?php echo esc_attr( $key ); ?>" value="<?php echo esc_attr( $socials[ $key ] ?? '' ); ?>" placeholder="https://" />
			<?php endforeach; ?>
		</td>
	</tr>
	<?php
}
add_action( 'rmss_author_edit_form_fields', 'trsss_author_profile_edit_social_fields', 30 );

/**
 * Save author social links.
 *
 * @param int $term_id Term ID.
 * @return void
 */
function trsss_author_profile_save_social_fields( $term_id ) {
	if ( ! isset( $_POST['trsss_author_profile_socials_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['trsss_author_profile_socials_nonce'] ) ), 'trsss_author_profile_socials' ) ) {
		return;
	}

	$posted = isset( $_POST['trsss_author_socials'] ) && is_array( $_POST['trsss_author_socials'] ) ? wp_unslash( $_POST['trsss_author_socials'] ) : array();
	$clean  = array();

	foreach ( trsss_author_profile_social_fields() as $key => $label ) {
		unset( $label );
		$value = isset( $posted[ $key ] ) ? esc_url_raw( $posted[ $key ] ) : '';
		if ( '' !== $value ) {
			$clean[ $key ] = $value;
		}
	}

	if ( empty( $clean ) ) {
		delete_term_meta( $term_id, 'trsss_author_socials' );
		return;
	}

	update_term_meta( $term_id, 'trsss_author_socials', $clean );
}
add_action( 'created_rmss_author', 'trsss_author_profile_save_social_fields', 30 );
add_action( 'edited_rmss_author', 'trsss_author_profile_save_social_fields', 30 );

/**
 * Current author profile layout from General settings.
 *
 * @return string
 */
function trsss_author_profile_get_layout() {
	$settings = trsss_get_shelfsage_settings_array();
	$layout   = isset( $settings['author_profile_layout'] ) ? sanitize_key( $settings['author_profile_layout'] ) : 'style-1';
	$allowed  = array( 'style-1', 'style-2', 'style-3', 'style-4' );

	return in_array( $layout, $allowed, true ) ? $layout : 'style-1';
}

/**
 * Author profile image URL.
 *
 * @param WP_Term $term Author term.
 * @return string
 */
function trsss_author_profile_image_url( $term ) {
	$image_id = get_term_meta( $term->term_id, 'rmss_image_id', true );
	return $image_id ? (string) wp_get_attachment_image_url( (int) $image_id, 'large' ) : '';
}

/**
 * Render author social links.
 *
 * @param WP_Term $term Author term.
 * @return string
 */
function trsss_author_profile_social_links( $term ) {
	$socials = get_term_meta( $term->term_id, 'trsss_author_socials', true );
	$socials = is_array( $socials ) ? $socials : array();
	$labels  = trsss_author_profile_social_fields();

	if ( empty( $socials ) ) {
		return '';
	}

	$out = '<div class="trsss-author-socials">';
	foreach ( $labels as $key => $label ) {
		if ( empty( $socials[ $key ] ) ) {
			continue;
		}
		$out .= '<a href="' . esc_url( $socials[ $key ] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $label ) . '</a>';
	}
	$out .= '</div>';

	return $out;
}

/**
 * Render author profile header for taxonomy-rmss_author archives.
 *
 * @param WP_Term $term Author term.
 * @param object  $taxonomy Taxonomy object.
 * @return void
 */
function trsss_author_profile_render_header( $term, $taxonomy ) {
	$layout    = trsss_author_profile_get_layout();
	$image_url = trsss_author_profile_image_url( $term );
	$bio       = term_description( $term->term_id, 'rmss_author' );
	$socials   = trsss_author_profile_social_links( $term );
	$count     = sprintf( _n( '%s Book', '%s Books', $term->count, 'shelfsage' ), number_format_i18n( $term->count ) );
	$initial   = function_exists( 'mb_substr' ) ? mb_substr( $term->name, 0, 1, 'UTF-8' ) : substr( $term->name, 0, 1 );
	?>
	<section class="trsss-author-profile trsss-author-profile--<?php echo esc_attr( $layout ); ?>">
		<div class="trsss-author-profile__media">
			<?php if ( $image_url ) : ?>
				<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $term->name ); ?>">
			<?php else : ?>
				<div class="trsss-author-profile__placeholder"><?php echo esc_html( strtoupper( $initial ) ); ?></div>
			<?php endif; ?>
		</div>
		<div class="trsss-author-profile__content">
			<span class="trsss-author-profile__label"><?php echo esc_html( $taxonomy->labels->singular_name ); ?></span>
			<h1><?php echo esc_html( $term->name ); ?></h1>
			<div class="trsss-author-profile__meta"><?php echo esc_html( $count ); ?></div>
			<?php if ( $bio ) : ?>
				<div class="trsss-author-profile__bio"><?php echo wp_kses_post( wpautop( $bio ) ); ?></div>
			<?php endif; ?>
			<?php echo wp_kses_post( $socials ); ?>
		</div>
	</section>
	<?php
}

/**
 * Print author profile styles on author archives.
 *
 * @return void
 */
function trsss_author_profile_styles() {
	if ( ! is_tax( 'rmss_author' ) ) {
		return;
	}
	?>
	<style id="trsss-author-profile-css">
	.trsss-author-profile{margin:0 0 3rem;padding:2rem;border:1px solid rgba(148,163,184,.22);background:#fff;box-shadow:0 18px 45px rgba(15,23,42,.07);display:grid;gap:2rem;align-items:center}.trsss-author-profile__media img,.trsss-author-profile__placeholder{width:180px;height:180px;object-fit:cover}.trsss-author-profile__placeholder{display:flex;align-items:center;justify-content:center;background:#ede9fe;color:#6d28d9;font-size:4rem;font-weight:900}.trsss-author-profile__label{display:inline-flex;margin-bottom:.75rem;padding:.3rem .7rem;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.trsss-author-profile h1{margin:0;color:#0f172a;font-size:clamp(2rem,4vw,3.8rem);line-height:1.05;font-weight:900;letter-spacing:0}.trsss-author-profile__meta{margin-top:.75rem;color:#64748b;font-weight:800}.trsss-author-profile__bio{margin-top:1.25rem;color:#475569;font-size:1.02rem;line-height:1.75;max-width:760px}.trsss-author-socials{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.25rem}.trsss-author-socials a{display:inline-flex;align-items:center;padding:.45rem .8rem;border:1px solid #e5e7eb;border-radius:999px;background:#f8fafc;color:#334155;font-size:.82rem;font-weight:800;text-decoration:none}.trsss-author-socials a:hover{border-color:#c4b5fd;background:#faf5ff;color:#6d28d9}.trsss-author-profile--style-1{grid-template-columns:220px minmax(0,1fr);border-radius:28px}.trsss-author-profile--style-1 .trsss-author-profile__media img,.trsss-author-profile--style-1 .trsss-author-profile__placeholder{border-radius:999px}.trsss-author-profile--style-2{grid-template-columns:minmax(0,1fr) 260px;border-radius:0;border-width:0 0 1px;box-shadow:none;background:linear-gradient(90deg,#fff,#f8fafc)}.trsss-author-profile--style-2 .trsss-author-profile__media{order:2}.trsss-author-profile--style-2 .trsss-author-profile__media img,.trsss-author-profile--style-2 .trsss-author-profile__placeholder{width:240px;height:300px;border-radius:18px}.trsss-author-profile--style-3{display:block;text-align:center;border-radius:32px;background:#111827;color:#fff}.trsss-author-profile--style-3 .trsss-author-profile__media{margin:-4.25rem auto 1.25rem;width:max-content}.trsss-author-profile--style-3 .trsss-author-profile__media img,.trsss-author-profile--style-3 .trsss-author-profile__placeholder{width:160px;height:160px;border-radius:999px;border:6px solid #fff}.trsss-author-profile--style-3 h1{color:#fff}.trsss-author-profile--style-3 .trsss-author-profile__bio,.trsss-author-profile--style-3 .trsss-author-profile__meta{color:#d1d5db;margin-left:auto;margin-right:auto}.trsss-author-profile--style-3 .trsss-author-socials{justify-content:center}.trsss-author-profile--style-4{grid-template-columns:160px minmax(0,1fr);border-radius:18px;background:#f8fafc;box-shadow:none}.trsss-author-profile--style-4 .trsss-author-profile__media img,.trsss-author-profile--style-4 .trsss-author-profile__placeholder{width:140px;height:140px;border-radius:16px}@media(max-width:720px){.trsss-author-profile,.trsss-author-profile--style-1,.trsss-author-profile--style-2,.trsss-author-profile--style-4{grid-template-columns:1fr;text-align:center}.trsss-author-profile--style-2 .trsss-author-profile__media{order:0}.trsss-author-profile__media{display:flex;justify-content:center}.trsss-author-socials{justify-content:center}.trsss-author-profile--style-3{margin-top:4rem}}
	</style>
	<?php
}
add_action( 'wp_head', 'trsss_author_profile_styles' );