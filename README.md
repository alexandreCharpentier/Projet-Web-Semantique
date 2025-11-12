


# Projet S5 — RDF / OWL

---

## Requêtes sur la qualité de l’air et le score des villes fleuries

### Moyenne du NO₂ pour les communes avec un score Fleur de 1
```sparql
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT (AVG(xsd:decimal(?no2)) AS ?moyenne)
WHERE {
  ?com rdf:type rcw:Commune ;
       rcw:scoreFleur ?score ;
       rcw:ville ?ville ;
       rcw:no2 ?no2 .
  FILTER(xsd:decimal(?score) = 1)
}
```

---

### Moyenne des polluants (NO₂, O₃, PM10) pour les communes avec un score Fleur de 1

```sparql
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT 
  (AVG(xsd:decimal(?no2)) AS ?moyenneNO2)
  (AVG(xsd:decimal(?o3)) AS ?moyenneO3)
  (AVG(xsd:decimal(?pm10)) AS ?moyennePM10)
WHERE {
  ?com rdf:type rcw:Commune ;
       rcw:scoreFleur ?score ;
       rcw:ville ?ville ;
       rcw:no2 ?no2 ;
       rcw:o3 ?o3 ;
       rcw:pm10 ?pm10 .
  FILTER(xsd:decimal(?score) = 1)
}
```

---

### Moyenne des polluants regroupée par score Fleur

```sparql
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT 
  ?score 
  (AVG(xsd:decimal(?no2)) AS ?moyenneNO2)
  (AVG(xsd:decimal(?o3)) AS ?moyenneO3)
  (AVG(xsd:decimal(?pm10)) AS ?moyennePM10)
WHERE {
  ?com rdf:type rcw:Commune ;
       rcw:scoreFleur ?score ;
       rcw:ville ?ville ;
       rcw:no2 ?no2 ;
       rcw:o3 ?o3 ;
       rcw:pm10 ?pm10 .
}
GROUP BY ?score
```

---

### Moyenne arrondie des polluants par score Fleur

```sparql
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT 
  (?score AS ?scoreVilleFleurie)
  (ROUND(AVG(xsd:decimal(?no2)) * 10) / 10 AS ?moyenneNO2)
  (ROUND(AVG(xsd:decimal(?o3)) * 10) / 10 AS ?moyenneO3)
  (ROUND(AVG(xsd:decimal(?pm10)) * 10) / 10 AS ?moyennePM10)
WHERE {
  ?com rdf:type rcw:Commune ;
       rcw:scoreFleur ?score ;
       rcw:ville ?ville ;
       rcw:no2 ?no2 ;
       rcw:o3 ?o3 ;
       rcw:pm10 ?pm10 .
}
GROUP BY ?score
```

---

## Enrichissement des données depuis Wikidata

### Ajout de la surface des communes

```sparql
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

INSERT {
  ?com rcw:surface ?surf .
}
WHERE {
  ?com a rcw:Commune ;
       rcw:insee ?insee .
  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataCom wdt:P374 ?insee ;
                 wdt:P2046 ?surf .
  }
}
```

---

### Ajout de la population 2016 des communes

```sparql
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>

INSERT {
  ?com rcw:population2016 ?pop2016 .
}
WHERE {
  ?com a rcw:Commune ;
       rcw:insee ?insee .

  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataCom wdt:P374 ?insee ;
                 p:P1082 ?popStatement .
    ?popStatement ps:P1082 ?pop2016 ;
                  pq:P585 ?date .
    FILTER(YEAR(?date) = 2016)
  }
}
```

---

## Calcul de la densité de population

### Densité pour chaque commune

```sparql
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>

SELECT 
  ?ville
  (ROUND(xsd:decimal(?population2016) / xsd:decimal(?surface)) AS ?densite)
WHERE {
  ?com a rcw:Commune ;
       rcw:ville ?ville ;
       rcw:population2016 ?population2016 ;
       rcw:surface ?surface .
}
```

---

## Pollution et densité selon le score Fleur

```sparql
PREFIX xsd: <http://www.w3.org/2001/XMLSchema>
PREFIX rcw: <https://cours.iut-orsay.fr/rcw/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns>
PREFIX com: <https://cours.iut-orsay.fr/commune>

SELECT 
  (?score AS ?scoreVilleFleurie)
  (ROUND(AVG(xsd:decimal(?no2)) * 10) / 10 AS ?moyenneNO2)
  (ROUND(AVG(xsd:decimal(?o3)) * 10) / 10 AS ?moyenneO3)
  (ROUND(AVG(xsd:decimal(?pm10)) * 10) / 10 AS ?moyennePM10)
  (ROUND(AVG(xsd:decimal(?densite)) * 10) / 10 AS ?moyenneDensite)
WHERE {
  ?com rdf:type rcw:Commune ;
       rcw:scoreFleur ?score ;
       rcw:ville ?ville ;
       rcw:no2 ?no2 ;
       rcw:o3 ?o3 ;
       rcw:pm10 ?pm10 ;
       rcw:population2016 ?population2016 ;
       rcw:surface ?surface .
  BIND(xsd:decimal(?population2016) / xsd:decimal(?surface) AS ?densite)
}
GROUP BY ?score
```
