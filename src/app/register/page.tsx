import { redirect } from "next/navigation";

export default function RegisterPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const email = searchParams.email;
  const role = searchParams.role;
  const token = searchParams.token;
  const jobId = searchParams.jobId;

  const params = new URLSearchParams();
  if (email) params.set("email", String(email));
  if (role) params.set("role", String(role));
  if (token) params.set("token", String(token));
  if (jobId) params.set("jobId", String(jobId));
  params.set("register", "true");

  redirect(`/?${params.toString()}`);
}
