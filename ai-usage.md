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

- Once the code was in a good place, I asked AI to update the tests, which were
  still using placeholder text. I'd go test-first if I were writing functions
  with a more defined input and output, but this project was somewhat more
  exploratory, so handling testing afterwards was the way forward. In doing so,
  AI noted several cases where I'd not enforced a maximum, and that the price
  comes back from MySQL as a string, not a number. I fixed these myself, and had
  AI write tests for the new upper limits.

- AI noted that a name with 255 characters that contained multiple code points
  would pass validation. Since this is how MySQL counts string length, they'd
  fail not at validation, but when creating/updating. There's an argument that
  it should fail at that layer, if a different implementation would handle it
  better, but I went with its suggestion of a new validation function to count
  code points, which it implemented.

- I wrote the first usage script, list-products, and tasked AI with writing the
  remaining sample scripts.

- AI noted a spec gap: the productToken is to be supplied, but my implementation
  had it generated as a UUIDv4 on product creation.
