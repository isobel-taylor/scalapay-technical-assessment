- Working out an issue setting up Sequelize to talk to the DB in Docker. Turned
  out to be a relatively simple issue with the arguments I was passing in (I was
  accidentally specifying the username and password twice, and those in the
  options object were overridden).

- Working out an issue with initial Sequelize setup. Specifically, the container
  hadn't picked up the database I set specified, and needed restarting, and I'd
  used UUIDv4 as a type rather than a default value.

- Workshop ways to approach error-handling, particularly with the case that an
  update might match a row, but not change it. It suggested several approaches,
  including a driver-level configuration change, but I chose to keep it explicit
  in code and do a check after the fact when it's detected that no rows changed.
