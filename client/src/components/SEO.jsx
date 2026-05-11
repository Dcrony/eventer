import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "TickiSpot | Event Ticketing, Live Streaming & Analytics in Nigeria",
  description = "TickiSpot is Nigeria’s event ticketing and management platform for Lagos and nationwide events. Sell tickets, host live streams, manage attendees, and track analytics from one powerful dashboard.",
  keywords = "tickispot, event ticketing platform Nigeria, sell tickets Lagos, live streaming events Nigeria, event management platform Africa, event analytics dashboard, ticketing software Nigeria",
  image = "https://tickispot.com/ticki.jpg",
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
      <meta name="theme-color" content="#db2777" />
      <link rel="icon" href="/icon.svg" />
      <link rel="shortcut icon" href="/icon.svg" />
      <link rel="apple-touch-icon" href="/icon.svg" />

      {/* Open Graph */}
      <meta property="og:site_name" content="TickiSpot" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content="TickiSpot event ticketing and live streaming platform in Nigeria" />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="en_NG" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tickispot" />
      <meta name="twitter:creator" content="@tickispot" />
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
              "description": "TickiSpot is Nigeria’s event ticketing, live streaming, and analytics platform for Lagos and nationwide events.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NG",
                "addressRegion": "Lagos"
              },
              "sameAs": [
                "https://x.com/tickispot",
                "https://www.facebook.com/share/1ArixBJeTq/",
                "https://www.tiktok.com/@tickispot?_r=1&_t=ZS-95sxo4URp72",
                "https://www.instagram.com/tickispot?igsh=a2oyMzIyandnb2J2"
              ]
            },
            {
              "@type": "WebSite",
              "name": "TickiSpot",
              "url": "https://tickispot.com"
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