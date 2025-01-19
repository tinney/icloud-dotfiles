# Initialize my "xenv" language runtime managers if installed

## Init Brew
eval "$(/opt/homebrew/bin/brew shellenv)"

if command -v rbenv &>/dev/null; then
  eval "$(rbenv init - bash)"
fi
if command -v pyenv &>/dev/null; then
  eval "$(pyenv init -)"
fi


# Additional PATH configuration
## My own scripts
PATH="$HOME/bin:$PATH"

# ## Ruby binstubs (note: this can be exploited at untrusted working directories!)
# PATH="$PATH:./bin"

# Shell-specific settings
# Nothing to see here
if [[ "$SHELL" == *zsh ]]; then
  true
## Bash settings
elif [[ "$SHELL" == *bash ]]; then
  export BASH_SILENCE_DEPRECATION_WARNING=1
  ### stickier .bash_history
  shopt -s histappend
  ### Set up tab-completion (requires `brew install bash-completion`)
  if [ -f $(brew --prefix)/etc/bash_completion ]; then
    source $(brew --prefix)/etc/bash_completion
  fi
fi
## Set fzf to use rg like so for ctrl-t in shell:
export FZF_DEFAULT_COMMAND='rg --files --no-ignore --hidden --follow --glob "!{.git,node_modules,vendor}/*"'
## Increase limit of open file descriptors because watch processes
ulimit -n 10000
## Reference the location of iCloud Drive
export ICLOUD_DRIVE="$HOME/icloud-drive"
## Source ENV variables
# source "$ICLOUD_DRIVE/dotfiles/.env"

## load custom PS1 prompt
## turn off 💚 bin for starship
# source $HOME/bin/ps1

# Added for starship
eval "$(starship init bash)"

export PATH="$HOME/.cargo/bin:$PATH"

# z command
. `brew --prefix`/etc/profile.d/z.sh

export PATH="$PATH:vendor/bundle/bin"
#export PATH="/usr/local/opt/openssl/bin:$PATH"
## Editor registration for git, etc
export CLICOLOR=1
export LSCOLORS=ExFxCxDxBxegedabagacad
export LC_CTYPE="en_US.UTF-8"
export EDITOR=/usr/bin/vim
# Other Customization

## Alias Information
# alias fgems='gem uninstall -aIx'
# alias cleanvim='find . -name '\''*.swp'\'' | xargs rm -rf'
alias be='bundle exec'

## Git
# alias gpp="git pull --rebase && git push"
# alias gp="git pull"
# alias gf="git fetch"
# alias gc="git commit"
# alias gpuf="git pushf"
# alias g="git"
# alias conflicts="git ls-files --unmerged | cut -f2 | sort -u"

# aliases for awk
# alias first="awk '{ print \$1 }'"
# alias second="awk '{ print \$2 }'"
# alias third="awk '{ print \$3 }'"
# alias fourth="awk '{ print \$4 }'"
# alias fifth="awk '{ print \$5 }'"
# alias sixth="awk '{ print \$6 }'"
# alias seventh="awk '{ print \$7 }'"
# alias eighth="awk '{ print \$8 }'"
# alias ninth="awk '{ print \$9 }'"
# alias tenth="awk '{ print \$10 }'"

# aliases for pairing
# alias cuke='rake cucumber -r features'
# alias addpair='gh-auth add --users $1 --command="$( which tmux ) attach -t pair"'

# fix commands
alias cp='cp -i' 

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"

#ASDF
. /opt/homebrew/opt/asdf/libexec/asdf.sh

# test -e "${HOME}/.iterm2_shell_integration.bash" && source "${HOME}/.iterm2_shell_integration.bash"
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
export NGROK_AUTHTOKEN="7j81xDnzLrAYwNNJndJ4M_djt6uaUU71WTP2nvNRs8"
