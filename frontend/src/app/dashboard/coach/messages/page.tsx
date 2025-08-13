import Link from 'next/link';

const mockChats = [{ id: '1', name: 'Sample Chat' }];

export default function Page() {
  return (
    <div>
      <h1>Coach Messages</h1>
      <ul>
        {mockChats.map((chat) => (
          <li key={chat.id}>
            <Link href={`/dashboard/coach/messages/${chat.id}`}>{chat.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
