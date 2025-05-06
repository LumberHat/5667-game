
git remote set-url origin https://$1@github.com/LumberHat/5667-game.git
git config pull.rebase false
git pull origin main --allow-unrelated-histories
git push origin main
