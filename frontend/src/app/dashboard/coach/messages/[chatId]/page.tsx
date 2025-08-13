interface PageProps {
  params: { chatId: string };
}

export default function Page({ params }: PageProps) {
  return (
    <div>
      <h1>Chat {params.chatId}</h1>
      <p>Conversation content coming soon.</p>
    </div>
  );
}
