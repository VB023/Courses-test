# Mes courses de la semaine

Application web statique : on choisit ses repas de la semaine, elle en déduit la liste de courses
agrégée par rayon. Aucun serveur, aucune base de données, aucun compte — tout tient dans des
fichiers statiques et les données restent dans le navigateur.

Pendant du classeur `Courses - menus vie courante.xlsx` : mêmes recettes, mêmes quantités.

## Arborescence

```
.
├── index.html                  structure de la page (aucun style, aucun script en ligne)
├── assets/
│   ├── styles.css              thème clair et sombre, jetons de couleur dans :root
│   └── app.js                  filtres, sélection, agrégation, liste de courses
├── data/
│   └── recettes.json           LES DONNÉES — le seul fichier à modifier au quotidien
├── icons/                      icônes d'installation (192, 512, maskable)
├── manifest.webmanifest        installation sur l'écran d'accueil
└── sw.js                       cache hors ligne
```

## Mise en ligne sur GitHub Pages

1. Créer un dépôt **public** nommé `courses` (un dépôt privé ne peut pas servir de pages sans
   abonnement payant).
2. Déposer ces fichiers à la racine du dépôt, puis :

   ```bash
   git init
   git add .
   git commit -m "Application de courses"
   git branch -M main
   git remote add origin git@github.com:<votre-compte>/courses.git
   git push -u origin main
   ```

3. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**,
   branche `main`, dossier `/ (root)`. Enregistrer.
4. Après une à deux minutes, le site est servi sur
   `https://<votre-compte>.github.io/courses/`.

Tous les chemins du projet sont **relatifs** (`./assets/...`), donc le site fonctionne aussi bien à
la racine d'un domaine que dans un sous-dossier `/courses/`. Ne pas les passer en chemins absolus
(`/assets/...`) : la page se chargerait sans style sur GitHub Pages.

## Installation sur le téléphone

Ouvrir l'adresse dans Safari ou Chrome, puis « Ajouter à l'écran d'accueil ». L'application
s'ouvre alors en plein écran, sans barre d'adresse, et **fonctionne sans réseau** une fois chargée
— utile dans un magasin au sous-sol. La sélection de la semaine et les cases cochées sont
conservées dans le navigateur (`localStorage`) : elles survivent à la fermeture, mais restent
propres à cet appareil et à ce navigateur.

## Modifier les recettes

Tout est dans `data/recettes.json` :

```jsonc
{
  "rayons": ["Fruits & légumes", "..."],          // ordre de parcours du magasin
  "ingredients": {
    "Courgette": { "u": "pièce", "r": "Fruits & légumes" }   // unité, rayon
  },
  "recettes": [
    {
      "cat": "Pâtes",            // catégorie
      "nom": "Pâtes bolognaise", // identifiant : unique, et à ne jamais renommer à la légère
      "tt": 40,                  // temps total en minutes
      "ta": 20,                  // dont temps actif
      "d": "Moyen",              // Facile | Moyen | Soutenu
      "ty": "Végé",              // Végé | Viande | Poisson
      "new": false,              // affiche la pastille « nouveau »
      "ing": [ { "n": "Pâtes", "q": 100 } ]   // nom d'ingrédient, quantité PAR PERSONNE
    }
  ]
}
```

Deux règles :

- tout nom figurant dans `ing[].n` doit exister comme clé dans `ingredients`, sinon l'application
  plante sur cette recette ;
- `nom` sert de clé de sélection et de clé de stockage local. Le renommer fait disparaître la
  recette des semaines déjà planifiées sur l'appareil.

Après modification, relancer un `git push` : GitHub Pages redéploie en une minute. **Incrémenter
`VERSION` dans `sw.js`** (`courses-v1` → `courses-v2`), sinon les téléphones qui ont déjà installé
l'application continueront de servir l'ancienne version depuis leur cache.

## Développer en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Ne pas ouvrir `index.html` par double-clic : en `file://`, le navigateur refuse de lire
`data/recettes.json` et la page reste vide. Le message d'erreur affiché le rappelle.

## Licence et dépendances

Aucune dépendance, aucun outil de compilation, aucun paquet npm. Seules les polices Fraunces et
Public Sans sont chargées depuis Google Fonts ; pour un fonctionnement 100 % autonome, les
télécharger dans `assets/fonts/` et remplacer le `<link>` de `index.html` par une règle
`@font-face`.
