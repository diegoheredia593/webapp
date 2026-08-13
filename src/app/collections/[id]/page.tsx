"use client";

import { use, useEffect, useState } from "react";
import Gallery from "@/components/Gallery";
import { api } from "@/lib/apiClient";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState<string>("Collection");

  useEffect(() => {
    api.listCollections().then((r) => {
      const found = r.collections.find((c) => c.id === id);
      if (found) setName(found.name);
    });
  }, [id]);

  return (
    <Gallery
      title={name}
      collectionId={id}
      emptyHint="No inspirations in this collection yet. Add some from an inspiration's detail page."
    />
  );
}
