tdd:
	@NODE_ENV=test ./node_modules/.bin/mocha -b -G -w \
	--compilers coffee:coffee-script \
	--reporter spec test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b -G \
	--compilers coffee:coffee-script \
	--reporter spec test

.PHONY: tdd test