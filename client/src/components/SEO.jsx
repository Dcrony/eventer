import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "TickiSpot – Event Ticketing & Management Platform in Nigeria",
  description = "Discover and buy tickets for concerts, conferences, parties and more in Nigeria. Create and manage events effortlessly.",
  keywords = "event ticketing Nigeria, sell tickets Lagos, event management platform, buy concert tickets Nigeria, TickiSpot",
  image = "https://tickispot.com/ticki.jpg",   // ← Make sure this image exists and is 1200x630
  url = "https://tickispot.com",
  type = "website",
}) => {
  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
<meta property="og:site_name" content="TickiSpot" />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="TickiSpot" />
      <meta property="og:locale" content="en_NG" />

      {/* Image dimensions for better previews */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
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
                "https://x.com/tickispot",
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