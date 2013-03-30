release:
		@make pack

pack:
		rm -rf package; rm -rf socket-pool*.tgz; 
		npm pack .

test:
		@mocha -r should -R spec

.PHONY: test