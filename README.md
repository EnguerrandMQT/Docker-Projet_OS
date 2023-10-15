# Docker-Projet_OS

## Introduction

Un morpion sympathique, pour jouer avec ses amis. Jouable en temps direct vous prendrez plaisir à jouer. Un système de sauvegarde des victoires, défaite et égalité est présent. Vous pouvez également choisir votre pseudo !

Il n'y a pas de système de compte pour le moment, vous êtes donc libre de jouer avec votre propre pseudo ou celui de votre voisin pour lui faire perdre des points ! Après tout, je ne suis pas responsable de vos amis.

## Auteurs
- [Enguerrand MARQUANT](https://github.com/EnguerrandMQT)
- Clara GILLES

## Installation

Afin de lancer le projet, assurez-vous d'avoir docker et docker-compose d'installés sur votre machine.

Lancez la commande ```npm run docker-start``` à la racine du dossier. L'ensemble des dépendances seront installées et le conteneur sera lancé.

***Attention** : La première fois que vous lancez le projet, l'ensemble des dépendances seront installées. Cela peut prendre un certain temps, soyez patient.*

***2e attention** : Lors du lancement du projet, le conteneur node attends que le conteneur mysql soit lancé et prêt à recevoir des connexions. Cela peut également prendre un peu de temps, patientez encore un peu.*

Avec cette commande, les logs de l'application seront également affichés. Vous pouvez les stopper avec CTRL+C et retourner dans le terminal, le conteneur tournera toujours.

N'oubliez surtout pas de l'éteindre, avec la commande ```npm run docker-stop```.

Afin d'accéder à l'application, rendez-vous sur http://localhost:4200/

Si vous souhaitez y accéder depuis un autre appareil, vous pouvez utiliser l'adresse IP de votre machine sur le réseau wifi. Vous pouvez la trouver avec la commande ```ipconfig``` sur Windows ou ```ifconfig``` sur Linux (généralement, c'est la dernière affichée, souvent sous la forme 192.168. ...).

## Dépendances

- Docker
- Docker-compose
- NodeJS
- npm
- less

## Easter Egg

Oui, il y en a un. Regarder le code source serait tricher, mais vous pouvez toujours essayer de le trouver par vous-même.

## Licence

Ce projet est sous licence [MIT](https://opensource.org/licenses/MIT).