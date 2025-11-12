async function fetchData() {
  const endpoint = "http://localhost:7200/repositories/Projet"; 
  const query = `
    PREFIX ex: <http://cours.iut-orsay.fr/>
    SELECT * WHERE {
      ?a ?b ?c
    } LIMIT 10
  `;
  
  const url = endpoint + "?query=" + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: { "Accept": "application/sparql-results+json" }
  });
  
  const data = await response.json();
  console.log(data.results.bindings);
}
fetchData();
