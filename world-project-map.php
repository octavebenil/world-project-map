<?php
/*
Plugin Name: World Projects Interactive Map
Description: Interactive map filtering posts by country taxonomy
Version: 1.7
Author: Octave Benil
*/

if (!defined('ABSPATH'))
    exit;

function wpim_enqueue_assets()
{

    // Load Tailwind CSS
    wp_enqueue_script('tailwind', "https://cdn.tailwindcss.com", [], null, false);

    // Load jsVectorMap CSS and JS
    wp_enqueue_style('jsvectormap', "https://cdn.jsdelivr.net/npm/jsvectormap/dist/css/jsvectormap.min.css");
    wp_enqueue_script('jsvectormap', "https://cdn.jsdelivr.net/npm/jsvectormap", [], null, true);
    wp_enqueue_script('jsvectormap-world', "https://cdn.jsdelivr.net/npm/jsvectormap/dist/maps/world.js", ['jsvectormap'], null, true);

    wp_enqueue_script(
            'wpim-map',
            plugin_dir_url(__FILE__) . 'js/map.js',
            ['jquery', 'jsvectormap', 'jsvectormap-world'],
            '1.0',
            true
    );

    wp_enqueue_style(
            'wpim-style',
            plugin_dir_url(__FILE__) . 'css/map.css'
    );

    $countries_json = plugin_dir_url(__FILE__) . "countries.json";

    wp_localize_script('wpim-map', 'WPIM', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'countries' => wpim_get_countries(),
            'countries_json' => json_decode($countries_json),
            'plugin_url' => plugin_dir_url(__FILE__),
            'home_url' => home_url('/')
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

    <div class="max-w-5xl w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mx-auto">

        <div class="p-8 text-center border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-left w-full">
                <h3 class="text-2xl font-bold text-gray-800">Dropstone Intervention Map</h3>
                <p class="text-sm text-gray-500 mt-3">Click on an orange-colored country to discover our actions.</p>
            </div>
        </div>

        <div class="p-4 bg-white relative">
            <div id="wpim-map" class="rounded-xl overflow-hidden border border-gray-200" style="width: 100%; height: 60vh; min-height: 400px;"></div>

            <!-- Global button centered at the bottom -->
            <!--            <div class="mt-6 mb-2 flex justify-center">-->
            <!--                <a href="--><?php //echo esc_url(home_url('/country/global')); ?><!--" target="_blank" -->
            <!--                   class="inline-flex items-center justify-center px-8 py-3 bg-orange-500 text-white font-bold text-lg rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 border-2 border-transparent">-->
            <!--                    🌍 Global Project-->
            <!--                </a>-->
            <!--            </div>-->
        </div>
    </div>


    <div class="elementor-widget-container" style="display: none;">
        <select id="country_list" onchange="if(this.value) window.location.href=this.value;">
            <option value="">Select a Country</option>

            <?php foreach (wpim_get_countries() as $country) { ?>
                <option value="<?php echo esc_url(home_url('/' . $country['slug'])); ?>"><?php echo esc_html($country['name']); ?></option>
            <?php } ?>

        </select>
    </div>

    <div class="wpim-projects">
        <div id="wpim-country">
            <h2 id="wpim-country-name">NOS PROJETS</h2>
        </div>
        <div id="wpim-projects"></div>
    </div>

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