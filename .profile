# Initialize my "xenv" language runtime managers if installed
if command -v rbenv &>/dev/null; then
  eval "$(rbenv init -)"
fi
if command -v nodenv &>/dev/null; then
  export PATH="$HOME/.nodenv/bin:$PATH"
  eval "$(nodenv init -)"
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

if [[ "$SHELL" == *zsh ]]; then
  # Nothing to see here
  true
elif [[ "$SHELL" == *bash ]]; then
  ## Bash settings

  ### stickier .bash_history
  shopt -s histappend

  ### Set up tab-completion (requires `brew install bash-completion`)
  if [ -f $(brew --prefix)/etc/bash_completion ]; then
    source $(brew --prefix)/etc/bash_completion
  fi
fi

  ## Bash settings

  ### stickier .bash_history
  shopt -s histappend

  ### Set up tab-completion (requires `brew install bash-completion`)
  if [ -f $(brew --prefix)/etc/bash_completion ]; then
    source $(brew --prefix)/etc/bash_completion
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
source $HOME/bin/ps1

export PATH="$HOME/.cargo/bin:$PATH"

. `brew --prefix`/etc/profile.d/z.sh
export PATH="./node_modules/.bin:$PATH"
export PATH="$PATH:vendor/bundle/bin"
export PATH="/usr/local/opt/openssl/bin:$PATH"

## Editor registration for git, etc
export CLICOLOR=1
export LSCOLORS=ExFxCxDxBxegedabagacad
export LC_CTYPE="en_US.UTF-8"
export EDITOR=/usr/bin/vim

# Other Customization
## Alias Information
alias hibernateon="sudo pmset -a hibernatemode 5"
alias hibernateoff="sudo pmset -a hibernatemode 0"

alias fuck='gem uninstall -aIx'
alias be='bundle exec'
alias cleanvim='find . -name '\''*.swp'\'' | xargs rm -rf'

## Git
alias gpp="git pull --rebase && git push"
alias gp="git pull"
alias gf="git fetch"
alias gc="git commit"
alias gpuf="git pushf"
alias g="git"
alias conflicts="git ls-files --unmerged | cut -f2 | sort -u"

# aliases for awk
alias first="awk '{ print \$1 }'"
alias second="awk '{ print \$2 }'"
alias third="awk '{ print \$3 }'"
alias fourth="awk '{ print \$4 }'"
alias fifth="awk '{ print \$5 }'"
alias sixth="awk '{ print \$6 }'"
alias seventh="awk '{ print \$7 }'"
alias eighth="awk '{ print \$8 }'"
alias ninth="awk '{ print \$9 }'"
alias tenth="awk '{ print \$10 }'"


# aliases for pairing
alias cuke='rake cucumber -r features'
alias addpair='gh-auth add --users $1 --command="$( which tmux ) attach -t pair"'
alias heroku-setup-chase='heroku config:set CLIENT_CHASE_EXTERNAL_ASSET_BASE_URL=https://client-chase-ui.s3.amazonaws.com/master/ CLIENT_CHASE=true ROOSTIFY_UI_EXTERNAL_ASSET_BASE_URL=https://roostify-ui-dev.s3.amazonaws.com/master/ VUEIFY=true VUE_IM=true SECURITY_IP_FILTER_ENABLED=true -a'

# fix commands
alias cp='cp -i'

### Added by the Heroku Toolbelt
export PATH="/usr/local/heroku/bin:$PATH"

# z command
. /usr/local/etc/profile.d/z.sh
## Popular Pays
# export PATH="/usr/local/opt/qt@5.5/bin:$PATH"
# alias pp_suite_start='rails s -b 0.0.0.0' why did they use 0.0.0.0 for this?
# alias pp_social_data_start='foreman start' foreman still used?

test -e "${HOME}/.iterm2_shell_integration.bash" && source "${HOME}/.iterm2_shell_integration.bash"

