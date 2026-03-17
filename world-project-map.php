<?php
/*
Plugin Name: World Projects Interactive Map
Description: Interactive map filtering posts by country taxonomy
Version: 1.4
Author: Octave Benil
*/

if (!defined('ABSPATH'))
    exit;

function wpim_enqueue_assets()
{

    wp_enqueue_script('d3', "https://d3js.org/d3.v7.min.js", [], null, true);
    wp_enqueue_script('topojson', "https://unpkg.com/topojson@3", [], null, true);

    wp_enqueue_script(
        'wpim-map',
        plugin_dir_url(__FILE__) . 'js/map.js',
        ['jquery'],
        '1.0',
        true
    );

    wp_enqueue_style(
        'wpim-style',
        plugin_dir_url(__FILE__) . 'css/map.css'
    );

    wp_localize_script('wpim-map', 'WPIM', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'countries' => wpim_get_countries()
    ]);

}

add_action('wp_enqueue_scripts', 'wpim_enqueue_assets');


function wpim_get_countries()
{

    $terms = get_terms([
        'taxonomy' => 'country',
        'hide_empty' => true
    ]);

    $data = [];

    foreach ($terms as $t) {

        $data[] = [
            'name' => $t->name,
            'slug' => $t->slug,
            'count' => $t->count
        ];

    }

    return $data;

}


function wpim_shortcode()
{

    ob_start();
    ?>

    <div id="wpim-map"></div>
    <div id="wpim-tooltip"></div>
    <div id="wpim-country">
        <h2 id="wpim-country-name"></h2>
    </div>
    <div id="wpim-projects"></div>

    <?php

    return ob_get_clean();

}

add_shortcode('world_project_map', 'wpim_shortcode');


function wpim_filter_projects()
{

    $countries = isset($_POST['countries']) ? $_POST['countries'] : [];
    $paged = isset($_POST['page']) ? intval($_POST['page']) : 1;

    $args = [
        'post_type' => 'post',
        'posts_per_page' => 6,
        'paged' => $paged
    ];

    if (!empty($countries)) {

        $args['tax_query'] = [
            [
                'taxonomy' => 'country',
                'field' => 'slug',
                'terms' => $countries
            ]
        ];

    }

    $query = new WP_Query($args);

    if ($query->have_posts()) {

        echo '<div class="wpim-project-grid">';

        while ($query->have_posts()) {

            $query->the_post();

            $image = get_the_post_thumbnail_url(get_the_ID(), 'large');
            $link = get_permalink();
            $date = get_the_date();

            echo '
<div class="wpim-project-card">
<a href="' . $link . '">
<div class="wpim-image" style="background-image:url(' . $image . ')"></div>
<div class="wpim-content">
<h3>' . get_the_title() . '</h3>
<p>' . wp_trim_words(get_the_excerpt(), 25) . '</p>
<span class="wpim-more">EN SAVOIR PLUS »</span>
</div>
<div class="wpim-date">' . $date . '</div>
</a>
</div>
';

        }

        echo '</div>';


        /* pagination */

        $total_pages = $query->max_num_pages;

        if ($total_pages > 1) {

            echo '<div class="wpim-pagination">';

            for ($i = 1; $i <= $total_pages; $i++) {

                echo '<span class="wpim-page" data-page="' . $i . '">' . $i . '</span>';

            }

            echo '</div>';

        }

    }

    wp_reset_postdata();

    wp_die();

}

add_action('wp_ajax_wpim_filter', 'wpim_filter_projects');
add_action('wp_ajax_nopriv_wpim_filter', 'wpim_filter_projects');