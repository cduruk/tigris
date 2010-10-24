default_run_options[:pty]   = true
ssh_options[:forward_agent] = true

set :application, "tigris"
set :scm, :git
set :user, "cduruk"
set :repository,  "git@github.com:cduruk/tigris.git"

role :web, "linode"
role :app, "linode"

set :deploy_via, :export
set :shared_children, []

set :deploy_to, "/srv/www/tigris.duruk.net/public_html"