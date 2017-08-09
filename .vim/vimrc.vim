call plug#begin('~/.vim/plugged')

" Make sure you use single quotes

" Shorthand notation; fetches https://github.com/junegunn/vim-easy-align
Plug 'junegunn/vim-easy-align'

" Any valid git URL is allowed
Plug 'https://github.com/junegunn/vim-github-dashboard.git'

" Group dependencies, vim-snippets depends on ultisnips
Plug 'SirVer/ultisnips' | Plug 'honza/vim-snippets'

" On-demand loading
Plug 'scrooloose/nerdtree', { 'on':  'NERDTreeToggle' }
Plug 'tpope/vim-fireplace', { 'for': 'clojure' }

" Using a non-master branch
Plug 'rdnetto/YCM-Generator', { 'branch': 'stable' }

" Using a tagged release; wildcard allowed (requires git 1.9.2 or above)
Plug 'fatih/vim-go', { 'tag': '*' }

" Plugin options
Plug 'nsf/gocode', { 'tag': 'v.20150303', 'rtp': 'vim' }

" Plugin outside ~/.vim/plugged with post-update hook
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
Plug 'junegunn/fzf.vim'

" Unmanaged plugin (manually installed and updated)
Plug '~/my-prototype-plugin'

" Add plugins to &runtimepath
call plug#end()

execute pathogen#infect()
syntax on
filetype plugin indent on

:set guifont=Monaco:h12
:set guioptions-=T
let mapleader=","

set autoindent "always indent
set bs=2
set clipboard=unnamed
set completeopt=longest,menuone
set expandtab
set grepformat=%f:%l:%m
set grepprg=ack
set hidden
set history=50 " always keep 50 lines of command history
set ignorecase
set incsearch
set mouse=a
set nocompatible
set nohlsearch
set nowrap
set number
set ruler
set relativenumber
set shiftwidth=2
set softtabstop=2
set tabstop=2
set smartcase
set smartindent
set smarttab
set wildmenu
set wildmode=longest,list,full
set visualbell

colorscheme vividchalk
syntax on
" compiler ruby "not sure what this does it was commented in
"
"neckbeard
let ruby_space_errors = 1
let c_space_errors = 1
"set colorcolumn=81 "meh this annoys me

cabbr W w
cabbr Q q
map <F1> <Esc>
imap <F1> <Esc>

" Shortcut to delete trailing whitespace
nmap <leader>w :let _s=@/<Bar>:%s/\s\+$//e<Bar>:let @/=_s<Bar>:nohl<CR>

" Move without w
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

" Disable K looking stuff up
map K <Nop>

" Textmate CMD-t emulation
let g:fuf_enumeratingLimit = 25
"map <leader>t :FufTaggedFile<CR>
map <leader>t :CtrlP<CR>
map <leader>T :CtrlPTag<CR>
map <leader><C-t> :RegenTags<CR>:FufRenewCache<CR>:CtrlPClearAllCaches<CR>
map <leader>l :CtrlPLine<CR>

" Force 2 lines above and below cursor
set scrolloff=2
let g:loaded_logipat = 1


if isdirectory($HOME . '/.vim-backup') == 0
  :silent !mkdir -p ~/.vim-backup >/dev/null 2>&1
endif
set backupdir=~/.vim-backup/
set backup

" Save your swp files to a less annoying place than the current directory.
" If you have .vim-swap in the current directory, it'll use that.
" Otherwise it saves it to ~/.vim/swap, ~/tmp or .
if isdirectory($HOME . '/.vim-swap') == 0
  :silent !mkdir -p ~/.vim-swap >/dev/null 2>&1
endif
set directory=~/.vim-swap//
set directory+=~/tmp//
set directory+=.

" bring up buffer list. ,,<CR> switches to last used buffer
map <leader>, :CtrlPBuffer<CR>

" comment out a line
map <leader>/ :TComment<Return>

" Find in cwd/"project"
noremap <leader>f :AckWithIgnore ''<Left>
noremap <leader>F :AckWithIgnore -i ''<Left>

" used to set the clipboard buffer to system clipboard. example use: ,cp to
" paste from clipboard
map <leader>c "*

" make E work
cabbrev E Explore

set clipboard=unnamed

let g:vim_ignore = [
                      \ "node_modules",
                      \ "dist",
                   \]

let g:ctrlp_custom_ignore = 'node_modules\|DS_Store\|git\|dist\|tmp'
