/*
 * This is just to do something similar to:
 * ```
 * dig @1.1.1.1 -c ch -t txt whoami.cloudflare +short
 * ```
 * since I can't figure out a way to do query ChaosNet records with nodejs..
 */

#include <ares.h>
#include <stdio.h>

void callback(void *args, ares_status_t status, size_t timeouts,
              const ares_dns_record_t *dnsrec) {
  // TODO: cleanup `dnsrec` and other things created/allocated here.
  if (!dnsrec || status != ARES_SUCCESS) {
    printf("Failed to query, error: %s\n", ares_strerror(status));
    return;
  }

  size_t query_cnt = ares_dns_record_query_cnt(dnsrec);
  printf("Query result: %zu\n", query_cnt);

  if (query_cnt != 1) {
    printf("did not return a result\n");
    return;
  }

  const char *dnsrec_question_name;
  ares_dns_rec_type_t dnsrec_type;
  ares_dns_class_t dnsrec_class;

  status = ares_dns_record_query_get(dnsrec, 0, &dnsrec_question_name,
                                     &dnsrec_type, &dnsrec_class);
  if (status != ARES_SUCCESS) {
    printf("Failed to retrieve dns record. Error: %s\n", ares_strerror(status));
    return;
  }

  printf("Query question: %s\n", dnsrec_question_name);
  printf("  Query rec type: %s\n", ares_dns_rec_type_tostr(dnsrec_type));
  printf("  Query class: %s\n", ares_dns_class_tostr(dnsrec_class));

  printf("\n");
  printf("dns resource:\n");

  size_t resource_cnt = ares_dns_record_rr_cnt(dnsrec, ARES_SECTION_ANSWER);
  printf("  resource cnt: %zu\n", resource_cnt);

  if (resource_cnt != 1) {
    printf("did not return a resource\n");
    return;
  }

  const ares_dns_rr_t *dns_resource =
      ares_dns_record_rr_get_const(dnsrec, ARES_SECTION_ANSWER, 0);

  size_t addr_len;
  const unsigned char *addr =
      ares_dns_rr_get_abin(dns_resource, ARES_RR_TXT_DATA, 0, &addr_len);

  printf("  addr data: %s\n", addr);
}

int main(void) {
  int status;
  int optmask;
  optmask |= ARES_OPT_EVENT_THREAD;

  status = ares_library_init(ARES_LIB_INIT_ALL);
  if (status != ARES_SUCCESS) {
    printf("Failed to init library, error: %s\n", ares_strerror(status));
    return 1;
  }

  struct ares_options options = {0};
  options.evsys = ARES_EVSYS_DEFAULT;
  ares_channel channel;
  status = ares_init_options(&channel, &options, optmask);
  if (status != ARES_SUCCESS) {
    printf("Failed to init library, error: %s\n", ares_strerror(status));
    return 1;
  }

  status = ares_set_servers_csv(channel, "1.1.1.1");
  if (status != ARES_SUCCESS) {
    printf("Failed to set resolve server to 1.1.1.1. error: %s\n",
           ares_strerror(status));
    return 1;
  }

  printf("Query 'whoami.cloudflare'...\n");

  status = ares_query_dnsrec(channel, "whoami.cloudflare", ARES_CLASS_CHAOS,
                             ARES_REC_TYPE_TXT, callback, NULL, NULL);
  if (status != ARES_SUCCESS) {
    printf("Failed to init query, error: %s\n", ares_strerror(status));
    return 1;
  }

  ares_queue_wait_empty(channel, -1);
  ares_destroy(channel);
  ares_library_cleanup();

  return 0;
}
