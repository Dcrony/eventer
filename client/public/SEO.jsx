import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "TickiSpot – Event Ticketing & Management Platform in Nigeria",
  description = "TickiSpot is a modern event ticketing and management platform built for creators and organizers. Sell tickets, manage events, track sales, and host live experiences effortlessly.",
  keywords = "event ticketing Nigeria, event management platform, sell event tickets online, event software Nigeria, ticketing system, event booking platform, TickiSpot",
  image = "https://tickispot.com/sea.png",
  url = "https://tickispot.com" || "https://tickispot.vercel.app",
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
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="TickiSpot" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* 🔥 STRUCTURED DATA (IMPORTANT FOR SEO RANKING) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "name": "TickiSpot",
              "url": "https://tickispot.com",
              "logo": "https://tickispot.com/icon.svgg",
              "foundingDate": "2024",
              "description":
                "TickiSpot is an all-in-one event ticketing and management platform that helps organizers create, promote, and manage events with ease.",
              "founders": [
                {
                  "@type": "Person",
                  "name": "Ibrahim Abdulmajeed",
                  "jobTitle": "Founder"
                },
                {
                  "@type": "Person",
                  "name": "OLarenwaju Oluwashinnayomi",
                  "jobTitle": "Co-Founder"
                }
              ],
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
                "target": "https://tickispot.com/search?q={search_term_string}",
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
              },
              "creator": {
                "@type": "Organization",
                "name": "TickiSpot"
              }
            }
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;