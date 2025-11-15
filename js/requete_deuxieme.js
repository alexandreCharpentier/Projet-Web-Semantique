async function fetchData() {
    const endpoint = "http://localhost:3000/"; 
    const query = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT (?score AS ?scoreVilleFleurie)
       (ROUND(AVG(xsd:decimal(?no2)) * 10) / 10 AS ?moyenneNO2)
       (ROUND(AVG(xsd:decimal(?o3)) * 10) / 10 AS ?moyenneO3)
       (ROUND(AVG(xsd:decimal(?pm10)) * 10) / 10 AS ?moyennePM10)
(ROUND(AVG(xsd:decimal(?population2016)) * 10) / 10 AS ?moyennepopulation)
(ROUND(AVG(xsd:decimal(?surface)) * 10) / 10 AS ?surface)
	   (ROUND(AVG(xsd:decimal(?densite)) * 10) / 10 AS ?moyenneDensite)
WHERE {
    ?com rdf:type rcw:Commune;
         rcw:scoreFleur ?score;
         rcw:ville ?ville;
         rcw:no2 ?no2 ;
         rcw:o3 ?o3 ;
         rcw:pm10 ?pm10 ;
         rcw:population2016 ?population2016 ;
         rcw:surface ?surface .
    BIND(xsd:decimal(?population2016) / xsd:decimal(?surface) AS ?densite)
} 
GROUP BY ?score ORDER BY ?scoreVilleFleurie
  `;

    const response = await fetch( endpoint + "sparql?query=" + encodeURIComponent(query));
    const data = await response.json();

    const csv = data.results_raw;
    const lines = csv.trim().split("\r\n");
    const headers = lines[0].split(",");

    const array = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => {
        obj[h] = parseFloat(values[i]);
        });
        return obj;
    });

    const labels = array.map(r => r.scoreVilleFleurie);
    const populations = array.map(r => r.moyennepopulation);
    const surfaces = array.map(r => r.surface);
    const densites = array.map(r => r.moyenneDensite);

    /* --- Graphique Population --- */
    function ChartPopulation(chart) {    
        new Chart(document.getElementById(chart), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Population moyenne',
                        data: populations,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Population moyenne selon le score Fleur' }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
    }


    /* --- Graphique Surface --- */
    function ChartSurface(chart) {
        new Chart(document.getElementById(chart), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Surface moyenne (km²)',
                        data: surfaces,
                        backgroundColor: 'rgba(255, 206, 86, 0.6)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Surface moyenne selon le score Fleur' }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    /* --- Graphique Densité --- */
    function ChartDensite(chart) {
        new Chart(document.getElementById(chart), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Densité moyenne (hab/km²)',
                        data: densites,
                        borderColor: 'red',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Densité moyenne selon le score Fleur' }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
    ChartPopulation('chart_population');
    ChartPopulation('chart_population2');
    ChartSurface('chart_surface');
    ChartSurface('chart_surface2');
    ChartDensite('chart_densite');
    ChartDensite('chart_densite2');
}

fetchData();
