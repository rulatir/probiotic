# Export a template to emit the comment for a group of rules that build a module
export MODULE_COMMENT§ = # $(MODULE§) build rules

# Export a template to emit a group of build rules for building a module; use the comment template defined above
export MODULE_BUILD§ = \
$(MODULE_COMMENT§)\
\
# Build (fake) object $(MODULE§) \
$(MODULE§)/$(MODULE§).o:\
	echo "This is the $(MODULE§) object" > $@
