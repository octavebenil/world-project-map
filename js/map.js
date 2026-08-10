let selectedCountry = null;
let selectedElement = null;
let currentPage = 1;
let mapInstance = null;


/* ---------------------------
LOAD PROJECTS
--------------------------- */

function loadProjects(page = 1) {

    currentPage = page;

    let countries = [];

    if (selectedCountry) {
        countries.push(selectedCountry);
    }

    jQuery.post(WPIM.ajax_url, {
        action: "wpim_filter",
        countries: countries,
        page: currentPage
    }, function (data) {

        console.log("Firenanea hafa")
        console.log(WPIM.countries);
        console.log(WPIM)

        iniateCountries(countries);

        try{
            document.getElementById("wpim-projects").innerHTML = data;
            document.getElementById("wpim-country-name").innerHTML = selectedCountry || "OUR PROJECTS";
        }
        catch(e){
            console.log("Erreur load project");
            console.log(e);
        }

    });

}

function loadCountries(){
    let countries = [];

    jQuery.post(WPIM.ajax_url, {
        action: "wpim_get_countries"
    }, function (data) {
        countries = data;

        console.log("COuntries")
        console.log(countries);

        iniateCountries(countries);
    });
}


function iniateCountries(countries){
    let countries_selct = document.getElementById("country_list");

    console.log("Country select")
    console.log(countries_selct)

    countries.forEach(country => {

        let option = document.createElement("option");
        option.value = "/country/"+country.slug;
        option.textContent = country.name;
        countries_selct.appendChild(option);

    })
}

function populateCountryDropdown() {
    let countries_selct = document.getElementById("country_list");

    if (!countries_selct) return;

    // Clear existing options except the first one
    while (countries_selct.options.length > 1) {
        countries_selct.remove(1);
    }

    // Populate with all countries from WPIM.countries
    WPIM.countries.forEach(country => {
        let option = document.createElement("option");
        option.value = "/country/" + country.slug;
        option.textContent = country.name;
        countries_selct.appendChild(option);
    });
}

/* ---------------------------
INIT
--------------------------- */

document.addEventListener("DOMContentLoaded", function () {

    loadCountries();
    //populateCountryDropdown();
    loadProjects();
    initMap();

});


/* ---------------------------
PAGINATION
--------------------------- */

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("wpim-page")) {

        let page = parseInt(e.target.dataset.page);
        loadProjects(page);

    }

});


/* ---------------------------
MAP - jsVectorMap
--------------------------- */

async function initMap() {

    // Create country links dictionary from WordPress countries
    const countryLinks = {};
    const codeToSlug = {}; // Mapping ISO code to WordPress slug

    // Load countries.json to get the mapping
    try {
        const response = await fetch(WPIM.plugin_url + "countries.json");
        const countriesJson = await response.json();

        // Create reverse mapping from country name to ISO code
        const countryNameToCode = {};
        for (const code in countriesJson) {
            const countryData = countriesJson[code];
            countryNameToCode[countryData.name] = code;
            // Also add French name as alternative
            countryNameToCode[countryData.fr] = code;
        }

        // Build country links from WordPress data
        WPIM.countries.forEach(country => {
            const code = countryNameToCode[country.name];
            if (code) {
                countryLinks[code] = WPIM.home_url + 'country/' + country.slug;
                codeToSlug[code] = country.slug; // Store slug for project loading
            }
        });
    } catch (error) {
        console.error("Error loading countries.json:", error);
        return;
    }

    // Create active countries object for series coloring
    const activeCountries = {};
    for (const code in countryLinks) {
        activeCountries[code] = "cible";
    }

    // Initialize jsVectorMap
    try {
        mapInstance = new jsVectorMap({
            selector: "#wpim-map",
            map: "world",
            zoomButtons: true,
            zoomOnScroll: true,

            // Configuration des couleurs via series
            series: {
                regions: [{
                    attribute: 'fill',
                    scale: {
                        cible: '#f97316' // Orange (orange-500)
                    },
                    values: activeCountries
                }]
            },

            // Style par défaut des régions
            regionStyle: {
                initial: {
                    fill: '#e5e7eb', // Gris clair pour les pays inactifs
                    stroke: '#ffffff',
                    strokeWidth: 0.5,
                    fillOpacity: 1
                },
                hover: {
                    fill: '#1d4ed8', // Bleu foncé (blue-700) au survol
                    cursor: 'pointer'
                }
            },

            // Action au clic
            onRegionClick: function(event, code) {
                if (codeToSlug[code]) {
                    // Load projects for the selected country
                    selectedCountry = codeToSlug[code];
                    document.getElementById("wpim-country-name").innerHTML = selectedCountry;
                    loadProjects(1);
                } else {
                    // For countries without projects, load all projects
                    selectedCountry = null;
                    document.getElementById("wpim-country-name").innerHTML = "";
                    loadProjects(1);
                }
            },

            // Personnalisation de l'infobulle
            onRegionTooltipShow: function(event, tooltip, code) {
                if (!countryLinks[code]) {
                    // Masque l'infobulle pour les pays sans lien
                    event.preventDefault();
                } else {
                    // Ajoute une indication d'action pour les pays valides
                    tooltip.text(tooltip.text() + " ↗");
                }
            }
        });
    } catch (error) {
        console.error("Error initializing jsVectorMap:", error);
    }

}