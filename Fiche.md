# 🧭 FICHE DE RÉVISION — WEB SÉMANTIQUE, RDF, OWL & WIKIDATA

---

## 🌍 1. De CSV → RDF avec Ontorefine (TP1)

### 🔹 Objectif :

Transformer des données tabulaires en graphe RDF cohérent.

### 🔹 Préfixes utilisés :

```ttl
@prefix rcw: <https://cours.iut-orsay.fr/rcw/> .
@prefix reg: <https://cours.iut-orsay.fr/rcw/region/> .
@prefix dep: <https://cours.iut-orsay.fr/rcw/departement/> .
@prefix circo: <https://cours.iut-orsay.fr/rcw/circonscription/> .
@prefix depu: <https://cours.iut-orsay.fr/rcw/depute/> .
@prefix cat: <https://cours.iut-orsay.fr/rcw/categorie/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

### 🔹 Exemple RDF (Paul Midy, député Essonne) :

```ttl
reg:11 a rcw:Région ;
    rdfs:label "Île-de-France"@fr ;
    rcw:comprend dep:91 .

dep:91 a rcw:Département ;
    rdfs:label "Essonne"@fr ;
    rcw:comprend circo:9105 .

circo:9105 a rcw:Circonscription ;
    rdfs:label "5ème Circonscription"@fr ;
    rcw:député depu:488 .

depu:488 a rcw:Député ;
    rcw:nom "MIDY" ;
    rcw:prénom "Paul" ;
    rcw:sexe "M" ;
    rcw:dateNaissance "1983-01-25"^^xsd:date ;
    rcw:catégorie cat:85 .

cat:85 a rcw:CatégorieSocioProfessionnelle ;
    rdfs:label "Personne diverse sans activité professionnelle..."@fr .
```

### 🔹 Requêtes SPARQL typiques :

* **Catégories socio-pro :**

  ```sparql
  SELECT ?catLabel (COUNT(?deputé) AS ?nb)
  WHERE {
    ?deputé rcw:catégorie ?cat .
    ?cat rdfs:label ?catLabel
  }
  GROUP BY ?catLabel ORDER BY DESC(?nb)
  ```

* **Régions avec le plus de députés :**

  ```sparql
  SELECT ?regLabel (COUNT(?deputé) AS ?nb)
  WHERE {
    ?reg a rcw:Région ; rcw:comprend ?dept ; rdfs:label ?regLabel .
    ?dept rcw:comprend ?circo .
    ?circo rcw:député ?deputé .
  }
  GROUP BY ?regLabel ORDER BY DESC(?nb)
  ```

* **Âge moyen par département :**

  ```sparql
  SELECT ?deptLabel (ROUND(AVG(YEAR(NOW())-YEAR(?dateNaissance))) AS ?ageMoyen)
  WHERE {
    ?dept rcw:comprend ?circo ; rdfs:label ?deptLabel .
    ?circo rcw:député ?dep . ?dep rcw:dateNaissance ?dateNaissance .
  }
  GROUP BY ?deptLabel ORDER BY ?ageMoyen
  ```

---

## 🧠 2. Wikidata et SPARQL (TP2)

### 🔹 Wikidata : base de connaissances collaborative (graphe RDF)

* **Entités :** `wd:Qxxx`
* **Propriétés directes :** `wdt:Pxxx`
* **Déclarations :** `p:Pxxx`
* **Valeurs :** `ps:Pxxx`
* **Qualificatifs :** `pq:Pxxx`

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
```

### 🔹 Requêtes importantes :

1. **Compter les humains :**

   ```sparql
   SELECT (COUNT(*) AS ?nbPersonnes) WHERE { ?p wdt:P31 wd:Q5. }
   ```
2. **Pays par surface :**

   ```sparql
   SELECT ?pays ?paysLabel ?surface WHERE {
     ?pays wdt:P31 wd:Q6256; wdt:P2046 ?surface.
     SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
   } ORDER BY DESC(?surface)
   ```
3. **Capitale européenne (vue Map) :**

   ```sparql
   SELECT ?capitale ?capitaleLabel ?coord WHERE {
     ?p wdt:P31 wd:Q6256; wdt:P30 wd:Q46; wdt:P36 ?capitale.
     ?capitale wdt:P625 ?coord.
     SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
   }
   ```

➡ Ces requêtes illustrent la **liaison RDF ↔ Wikidata** :
on y retrouve les concepts `wdt:P31` (= `rdf:type`), `P2046` (surface), `P625` (coordonnées)...

---

## 🪐 3. Enrichissement avec Wikidata (TP3)

### 🔹 Objectif :

Relier ton graphe local (départements, régions) à Wikidata via `owl:sameAs`
et importer des propriétés supplémentaires (population, surface, voisinage).

### 🔹 Requête CONSTRUCT (départements → Wikidata)

```sparql
CONSTRUCT {
  ?dept owl:sameAs ?wikidataDept ;
        rcw:surface ?area ;
        rcw:population ?population .
}
WHERE {
  ?dept a rcw:Département ; rdfs:label ?label .
  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataDept wdt:P31 wd:Q6465 ;
                  wdt:P1082 ?population ;
                  wdt:P2046 ?area ;
                  rdfs:label ?label .
    FILTER(LANG(?label)="fr")
  }
}
```

➡ Puis `INSERT` pour les stocker dans GraphDB.

### 🔹 Densité par département :

```sparql
SELECT ?deptLabel ((?population / ?surface) AS ?densite)
WHERE {
  ?dept a rcw:Département ; rdfs:label ?deptLabel ;
        rcw:surface ?surface ; rcw:population ?population .
}
ORDER BY DESC(?densite) LIMIT 10
```

### 🔹 Relations de voisinage entre régions :

```sparql
CONSTRUCT {
  ?reg rcw:shareBorderWith ?limitrophe .
}
WHERE {
  ?reg a rcw:Région ; owl:sameAs ?wikidataRegion .
  ?limitrophe a rcw:Région ; owl:sameAs ?wikidataLimitrophe .
  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataRegion wdt:P47 ?wikidataLimitrophe .
  }
}
```

➡ Requêtes associées :

* Régions limitrophes de l’Île-de-France :

  ```sparql
  SELECT ?label WHERE {
    ?idf rdfs:label "Île-de-France"@fr ; rcw:shareBorderWith ?lim.
    ?lim rdfs:label ?label .
  }
  ```
* Top 5 régions avec le plus de frontières :

  ```sparql
  SELECT ?regionLabel (COUNT(?lim) AS ?nb)
  WHERE { ?region rcw:shareBorderWith ?lim ; rdfs:label ?regionLabel. }
  GROUP BY ?regionLabel ORDER BY DESC(?nb) LIMIT 5
  ```

---

## 🧩 4. Raisonnement et OWL (TP4)

### 🔹 OWL → Logique de description

Permet d’exprimer ce que RDFS ne peut pas (identité, équivalence, cardinalité, transitivité…)

### 🔹 Concepts fondamentaux :

| Concept OWL                     | Sémantique              | Exemple                               |
| ------------------------------- | ----------------------- | ------------------------------------- |
| `owl:sameAs`                    | entités identiques      | `ex:a owl:sameAs ex:b`                |
| `owl:differentFrom`             | entités distinctes      | `ex:a owl:differentFrom ex:c`         |
| `owl:equivalentClass`           | mêmes individus         | `ex:A owl:equivalentClass ex:B`       |
| `owl:disjointWith`              | pas d’individu commun   | `ex:B owl:disjointWith ex:C`          |
| `owl:oneOf`                     | énumération             | `ex:A owl:oneOf (ex:a1 ex:a2)`        |
| `owl:intersectionOf`            | intersection de classes | `ex:C owl:intersectionOf (ex:A ex:B)` |
| `owl:FunctionalProperty`        | max un objet par sujet  | `hasMother`                           |
| `owl:InverseFunctionalProperty` | inverse unique          | `hasSocialSecurityNumber`             |

### 🔹 Hypothèses

* **Monde ouvert (OWA)** : absence ≠ faux
* **Pas d’unicité des noms (non-UNA)** : 2 IRIs peuvent désigner la même entité

### 🔹 Raisonneur OWL infère :

* Nouveaux faits implicites
* Inconsistances logiques (`owl:Nothing`)

### 🔹 Exemples de raisonnement :

**1️⃣**

```ttl
ex:A owl:equivalentClass ex:B .
ex:B owl:disjointWith ex:C .
ex:a rdf:type ex:A .
```

→ infère : `ex:a rdf:type ex:B .` et `ex:a owl:differentFrom ex:c .`

**2️⃣**

```ttl
ex:p rdf:type owl:FunctionalProperty .
ex:a ex:p ex:b .
ex:a ex:p ex:c .
```

→ infère : `ex:b owl:sameAs ex:c .`

**3️⃣**

```ttl
rcw:ancestorOf rdf:type owl:TransitiveProperty, owl:AsymmetricProperty .
```

---

## 🔗 5. Liens RDF ↔ Wikidata ↔ OWL

| Concept RDF local                | Équivalent Wikidata           | OWL / logique                        |
| -------------------------------- | ----------------------------- | ------------------------------------ |
| `rdf:type`                       | `wdt:P31`                     | Instance de                          |
| `rdfs:subClassOf`                | hiérarchie                    | Classe / sous-classe                 |
| `owl:sameAs`                     | lien entre entités identiques | Alignement                           |
| `rcw:surface` / `rcw:population` | `wdt:P2046` / `wdt:P1082`     | Données enrichies                    |
| `.ttl` fichier                   | représentation RDF            | Ontologie exploitable par raisonneur |

---

## 🎯 À retenir pour le contrôle :

✅ **RDF & Ontorefine**

* Modélisation claire : Région → Département → Circonscription → Député
* Triplets cohérents et IRIs propres

✅ **SPARQL**

* `SELECT`, `CONSTRUCT`, `INSERT`
* `FILTER(LANG(...))`, `GROUP BY`, `BIND`, `SERVICE`

✅ **Wikidata**

* `wdt` = valeur directe
* `p` / `ps` / `pq` = modèle complet (déclaration + qualificatifs)

✅ **OWL**

* Monde ouvert, noms non uniques
* Raisonnement automatique
* `owl:sameAs`, `owl:disjointWith`, `owl:FunctionalProperty`

✅ **GraphDB**

* Peut stocker RDF local
* Peut exécuter des requêtes fédérées vers Wikidata
