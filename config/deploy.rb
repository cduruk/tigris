default_run_options[:pty] = true
ssh_options[:forward_agent] = true

set :application, "duruknet"
set :scm, :git
set :user, "cduruk"
set :repository,  "git@github.com:cduruk/tigris.git"

role :web, "linode"                          # Your HTTP server, Apache/etc
role :app, "linode"                          # This may be the same as your `Web` server

set :deploy_via, :export
set :shared_children, []

set :deploy_to, "/srv/www/tigris.duruk.net/public_html"

# If you are using Passenger mod_rails uncomment this:
# if you're still using the script/reapear helper you will need
# these http://github.com/rails/irs_process_scripts

# namespace :deploy do
#   task :start do ; end
#   task :stop do ; end
#   task :restart, :roles => :app, :except => { :no_release => true } do
#     run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
#   end
# end