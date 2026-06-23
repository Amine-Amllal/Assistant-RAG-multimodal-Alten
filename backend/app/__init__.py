import truststore

# Use the OS certificate store (Windows) for TLS verification instead of the bundled
# certifi list. Required behind TLS-inspecting corporate proxies (e.g. Zscaler) whose
# root CA is trusted by the OS but not by certifi.
truststore.inject_into_ssl()
