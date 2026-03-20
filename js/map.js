let selectedCountry = null;
let selectedElement = null;
let currentPage = 1;
let isPinned = false;


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

        document.getElementById("wpim-projects").innerHTML = data;

        if (document.getElementById("wpim-country-name")) {
            document.getElementById("wpim-country-name").innerHTML = selectedCountry ?? "Tous les pays";
        }

    });

}


/* ---------------------------
INIT
--------------------------- */

document.addEventListener("DOMContentLoaded", function () {

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
MAP
--------------------------- */

function initMap() {

    const width = 1000;
    const height = 550;

    const svg = d3.select("#wpim-map")
        .append("svg")
        .attr("width", "100%")
        .attr("height", height);

    const isMobile = window.innerWidth < 810;

    /* ---------------------------
    PROJECTION (centrage propre)
    --------------------------- */

    const projection = d3.geoMercator()
        .scale(isMobile ? 260 : 150)
        .center(isMobile ? [15, 20] : [0, 20])
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const g = svg.append("g");

    const tooltip = d3.select("#wpim-tooltip");

    /* ---------------------------
    ZOOM
    --------------------------- */

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    /* ---------------------------
    ZOOM INITIAL MOBILE
    --------------------------- */

    if (isMobile) {

        const initialTransform = d3.zoomIdentity
            .translate(width * 0.15, height * 0.05)
            .scale(1.8);

        svg.call(zoom.transform, initialTransform);
    }

    /* ---------------------------
    RESET CLICK (fond)
    --------------------------- */

    svg.on("click", function (event) {

        if (event.target.tagName === "svg") {

            isPinned = false;
            tooltip.style("display", "none");

            if (selectedElement) {
                selectedElement.attr("fill", "#2c7be5");
            }

            selectedCountry = null;
            selectedElement = null;

            loadProjects(1);
        }

    });

    /* ---------------------------
    LOAD MAP
    --------------------------- */

    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(res => res.json())
        .then(data => {

            const countries = topojson.feature(data, data.objects.countries);

            g.selectAll("path")
                .data(countries.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", "#999")

                /* COLORS */

                .attr("fill", function (d) {

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    return match ? "#2c7be5" : "#e0e0e0";
                })


                /* ---------------------------
                HOVER
                --------------------------- */

                .on("mouseover", function (event, d) {

                    if (isPinned) return;

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    if (!match) return;


                    const [x, y] = path.centroid(d);
                    const svgRect = document.querySelector("#wpim-map svg").getBoundingClientRect();

                    tooltip
                        .style("display", "block")
                        .style("left", (svgRect.left + x + 10) + "px")
                        .style("top", (svgRect.top + y - 10) + "px")
                        .html("<strong>" + match.name + "</strong>");
                })

                .on("mousemove", function (event) {

                    if (isPinned) return;

                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
                })

                .on("mouseout", function () {

                    if (isPinned) return;

                    tooltip.style("display", "none");
                })


                /* ---------------------------
                CLICK
                --------------------------- */

                .on("click", function (event, d) {

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    if (!match) return;

                    /* CTRL + click */

                    if (event.ctrlKey) {
                        window.open("https://dropstone.ch/country/" + match.slug, "_blank");
                        return;
                    }

                    /* reset previous */

                    if (selectedElement) {
                        selectedElement.attr("fill", "#2c7be5");
                    }

                    selectedCountry = match.slug;
                    selectedElement = d3.select(this);

                    selectedElement.attr("fill", "#ff6600");

                    isPinned = true;

                    /* position tooltip fixe */

                    const [x, y] = path.centroid(d);
                    const svgRect = document.querySelector("#wpim-map svg").getBoundingClientRect();

                    tooltip
                        .style("display", "block")
                        .style("left", (svgRect.left + x + 10) + "px")
                        .style("top", (svgRect.top + y - 10) + "px")
                        .html("<strong>" + match.name + "</strong>");

                    loadProjects(1);
                });

        });

}