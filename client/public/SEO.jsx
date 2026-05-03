import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "TickiSpot – Event Ticketing & Management Platform in Nigeria",
  description = "Best platform to sell concert tickets in Lagos and across Nigeria. TickiSpot helps you manage events, track sales, and grow your audience.",
  keywords = "sell concert tickets Lagos, event ticketing Nigeria, event management platform Nigeria, ticketing system Lagos, TickiSpot",
  image = "https://tickispot.com/sea.png",
  url = "https://tickispot.com",
  type = "website",
}) => {
  return (
    <Helmet>
      {/* ✅ Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* ✅ Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="TickiSpot" />

      {/* ✅ Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ✅ STRUCTURED DATA */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "TickiSpot",
              "url": "https://tickispot.com",
              "logo": "https://tickispot.com/icon.svg",
              "foundingDate": "2025",
              "description":
                "Event ticketing platform for concerts, corporate events, and creators in Nigeria.",
              "sameAs": [
                "https://x.com/codewithdcrony",
                "https://linkedin.com/in/ibrahim-abdulmajeed"
              ]
            },
            {
              "@type": "WebSite",
              "name": "TickiSpot",
              "url": "https://tickispot.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://tickispot.com/search?query={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "SoftwareApplication",
              "name": "TickiSpot",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "NGN"
              }
            }
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;