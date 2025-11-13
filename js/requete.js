async function fetchData() {
  const endpoint = "http://localhost:3000/s"; 
  const query = `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT (?score AS ?scoreVilleFleurie)
       (ROUND(AVG(xsd:decimal(?no2)) * 10) / 10 AS ?moyenneNO2)
       (ROUND(AVG(xsd:decimal(?o3)) * 10) / 10 AS ?moyenneO3)
       (ROUND(AVG(xsd:decimal(?pm10)) * 10) / 10 AS ?moyennePM10)
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
GROUP BY ?score
  `;
  
  const url = endpoint + "?query=" + encodeURIComponent(query);
  const data = await fetch("http://localhost:3000/sparql?query=" + encodeURIComponent(query)).then(r => r.json());
  console.log(data.results_raw);
}
fetchData();
