tdd:
	@NODE_ENV=test ./node_modules/.bin/mocha -b -G -w \
	--reporter spec test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b -G \
	--reporter spec test

.PHONY: tdd test