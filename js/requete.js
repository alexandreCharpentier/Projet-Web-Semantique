async function fetchData() {
  const endpoint = "http://localhost:3000/s"; 
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
  
  const url = endpoint + "?query=" + encodeURIComponent(query);
  const data = await fetch("http://localhost:3000/sparql?query=" + encodeURIComponent(query)).then(r => r.json());
  console.log(data.results_raw);
}
fetchData();
