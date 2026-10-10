# SSF Morocco RP — Portail central

Portail web responsive pour une communauté Roleplay fictive : tableau de bord, missions, annonces, unités, QCM de démonstration, formulaire de candidature et panneau de gestion local.

## Publier gratuitement avec GitHub Pages
1. Créez un **nouveau dépôt public** sur GitHub pour ne pas remplacer votre ancien site.
2. Téléversez `index.html`, `style.css`, `app.js` et le dossier `assets` à la racine du dépôt.
3. Dans **Settings → Pages**, choisissez **Deploy from a branch**, puis `main` et `/ (root)`.
4. Enregistrez et attendez que GitHub fournisse l'adresse publique.

## Important concernant l'espace Admin
- Le panneau Admin demande un code d'accès de démonstration (`1937`) et peut être verrouillé à nouveau avec le bouton prévu.
- Le panneau permet d'ajouter et de supprimer des tâches et annonces.
- Les ajouts sont enregistrés dans le `localStorage` du navigateur utilisé. Ils ne sont **pas visibles automatiquement pour les autres visiteurs**.
- **Important :** le code `1937` est inscrit dans le JavaScript côté client. Il s'agit seulement d'un verrou visuel pour cette démo : une personne qui inspecte les fichiers peut le retrouver et contourner l'écran. Pour une vraie sécurité et des publications partagées, il faut une authentification côté serveur et une base de données (par exemple Supabase ou Firebase).
- Le formulaire de candidature est une prévisualisation locale et **n'envoie rien** à l'administration.
- Le QCM est un exemple de démonstration, pas une évaluation officielle.

Le site est un projet communautaire fictif et ne représente aucune institution gouvernementale réelle.

## Profil membre et candidatures (version de démonstration)
- Un membre peut enregistrer un nom de compte, une photo de profil, puis utiliser ces informations dans sa candidature.
- Dans l'espace Admin, la file de candidatures permet de consulter les demandes, les accepter avec un grade ou les refuser. Une liste des membres acceptés affiche le nom, la photo et le grade.
- Le bouton FR/عربي permet de basculer l'interface et le sens de lecture; quelques textes saisis par les membres restent dans la langue dans laquelle ils ont été écrits.
- Cette version garde les profils, candidatures, grades et publications dans le stockage local du navigateur. **Elle ne confirme pas automatiquement que le nom appartient réellement au compte d'une plateforme, et les données ne se synchronisent pas entre appareils.** Pour un vrai système de comptes partagés, il faut connecter Firebase/Supabase (authentification, base de données, règles d'accès) et vérifier les comptes via le service concerné.
