pack:
		rm -rf package; rm -rf ????*.tgz; 
		npm pack .

test:
		@mocha -r should -R spec

.PHONY: test