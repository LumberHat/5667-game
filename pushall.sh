$TOKEN=$1

git remote set-url https://$TOKEN@github.com/LumberHat/5667-game.git
git pull origin main
git push origin main
