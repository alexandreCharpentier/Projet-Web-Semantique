async function fetchData() {
    const endpoint = "http://localhost:3000/"; 
    const query = `
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT (?score AS ?scoreVilleFleurie)
      (ROUND(AVG(xsd:decimal(?no2)) * 10) / 10 AS ?moyenneNO2)
      (ROUND(AVG(xsd:decimal(?o3)) * 10) / 10 AS ?moyenneO3)
      (ROUND(AVG(xsd:decimal(?pm10)) * 10) / 10 AS ?moyennePM10)
WHERE {
    ?com rdf:type rcw:Commune;
        rcw:scoreFleur ?score;
        rcw:ville ?ville;
        rcw:no2 ?no2 ;
        rcw:o3 ?o3 ;
        rcw:pm10 ?pm10 ;
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
    const no2 = array.map(r => r.moyenneNO2);
    const o3 = array.map(r => r.moyenneO3);
    const pm10 = array.map(r => r.moyennePM10);

    new Chart(document.getElementById('chart_premier_result'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'NO2', data: no2, backgroundColor: 'rgba(255, 99, 132, 0.6)' },
                { label: 'O3', data: o3, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
                { label: 'PM10', data: pm10, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                { 
                label: 'Moyenne', 
                data: no2.map((v,i) => (v + pm10[i])/2),
                type: 'line',
                borderColor: 'orange',
                backgroundColor: 'transparent',
                tension: 0.3,
                yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Niveaux de pollution selon le score Fleur' }
            },
            scales: {
                y: {
                    beginAtZero: false,       
                    min: 19,                
                    max: 32,                 
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

fetchData();
