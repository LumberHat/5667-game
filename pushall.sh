
git config --global user.email "lsb1412@hotmail.com"
git config --global user.name "LumberHat"
git config --global pull.rebase true

# git init
# git commit -am "w"

git remote set-url origin https://$1@github.com/LumberHat/5667-game.git
git branch -M main

git push --force origin main 
