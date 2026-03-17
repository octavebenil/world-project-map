let selectedCountry = null;
let selectedElement = null;
let currentPage = 1;


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

        console.log("DOnnnnéee")
        console.log(selectedCountry)
        console.log(data)
        document.getElementById("wpim-projects").innerHTML = data;
        document.getElementById("wpim-country-name").innerHTML = selectedCountry;

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

    const projection = d3.geoMercator()
        .scale(isMobile ? 220 : 150)
        .center(isMobile ? [15, 10] : [0, 20])
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const g = svg.append("g");

    const tooltip = d3.select("#wpim-tooltip");

    /* zoom */

    svg.call(
        d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
            g.attr("transform", event.transform);
        })
    );

    /* load world map */

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

                /* colors */

                .attr("fill", function (d) {

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    return match ? "#2c7be5" : "#e0e0e0";

                })


                /* ---------------------------
                TOOLTIP
                --------------------------- */

                .on("mouseover", function (event, d) {

                    let match = WPIM.countries.find(c =>
                        d.properties.name &&
                        d.properties.name.toLowerCase().includes(c.name.toLowerCase())
                    );

                    if (!match) return;

                    tooltip
                        .style("display", "block")
                        .html("<strong>" + match.name + "</strong><br>" + match.count + " projets");

                })

                .on("mousemove", function (event) {

                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");

                })

                .on("mouseout", function () {

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

                    /* CTRL + click → open page */

                    if (event.ctrlKey) {
                        window.open("https://dropstone.ch/country/" + match.slug, "_blank");
                        return;
                    }

                    /* reset previous */

                    if (selectedElement) {
                        selectedElement.attr("fill", "#2c7be5");
                    }

                    /* select new */

                    selectedCountry = match.slug;
                    selectedElement = d3.select(this);

                    selectedElement.attr("fill", "#ff6600");

                    loadProjects(1);

                });

        });

}