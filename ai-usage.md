- Working out an issue setting up Sequelize to talk to the DB in Docker. Turned
  out to be a relatively simple issue with the arguments I was passing in (I was
  accidentally specifying the username and password twice, and those in the
  options object were overridden).
