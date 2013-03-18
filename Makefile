pack:
		rm -rf package; rm -rf ????*.tgz; 
		npm pack .

test:
		@mocha -R spec

.PHONY: test