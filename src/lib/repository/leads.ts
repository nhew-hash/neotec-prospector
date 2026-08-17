import { getStore, TABLES } from "@/lib/db";
import type {
  Company,
  Lead,
  LeadContact,
  LeadDetail,
  LeadFollowup,
  LeadNote,
  LeadStatus,
  LeadStatusHistory,
  LeadTemperature,
  LeadWithCompany,
  PublicUser,
} from "@/types";
import { toPublicUser } from "@/lib/auth/users";
import { getUserById } from "@/lib/auth/users";

export interface LeadFilters {
  city?: string;
  segment?: string;
  minScore?: number;
  temperature?: LeadTemperature;
  hasWebsite?: boolean; // true = has site, false = "Site não encontrado"
  hasWhatsapp?: boolean;
  status?: LeadStatus;
  assignedTo?: string;
}

export async function listLeadsWithCompany(filters: LeadFilters = {}): Promise<LeadWithCompany[]> {
  const store = getStore();
  const leads = await store.list<Lead>(TABLES.leads, { orderBy: { field: "score", dir: "desc" } });
  const companies = await store.list<Company>(TABLES.companies);
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  let combined: LeadWithCompany[] = leads
    .map((lead) => {
      const company = companyMap.get(lead.company_id);
      if (!company) return null;
      return { ...lead, company };
    })
    .filter((l): l is LeadWithCompany => l !== null);

  if (filters.city) {
    combined = combined.filter((l) => l.company.city.toLowerCase() === filters.city!.toLowerCase());
  }
  if (filters.segment) {
    combined = combined.filter((l) => l.segment === filters.segment);
  }
  if (filters.minScore !== undefined) {
    combined = combined.filter((l) => l.score >= filters.minScore!);
  }
  if (filters.temperature) {
    combined = combined.filter((l) => l.temperature === filters.temperature);
  }
  if (filters.hasWebsite !== undefined) {
    combined = combined.filter((l) => l.site_analysis.possui_site === filters.hasWebsite);
  }
  if (filters.hasWhatsapp !== undefined) {
    combined = combined.filter((l) => Boolean(l.company.whatsapp) === filters.hasWhatsapp);
  }
  if (filters.status) {
    combined = combined.filter((l) => l.status === filters.status);
  }
  if (filters.assignedTo) {
    combined = combined.filter((l) => l.assigned_to === filters.assignedTo);
  }

  return combined.sort((a, b) => b.score - a.score);
}

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const store = getStore();
  const lead = await store.get<Lead>(TABLES.leads, id);
  if (!lead) return null;
  const company = await store.get<Company>(TABLES.companies, lead.company_id);
  if (!company) return null;

  const [notes, followups, statusHistory, contacts] = await Promise.all([
    store.list<LeadNote>(TABLES.leadNotes, { where: { lead_id: id } }),
    store.list<LeadFollowup>(TABLES.leadFollowups, { where: { lead_id: id } }),
    store.list<LeadStatusHistory>(TABLES.leadStatusHistory, { where: { lead_id: id } }),
    store.list<LeadContact>(TABLES.leadContacts, { where: { lead_id: id } }),
  ]);

  let assignedUser: PublicUser | null = null;
  if (lead.assigned_to) {
    const user = await getUserById(lead.assigned_to);
    assignedUser = user ? toPublicUser(user) : null;
  }

  return {
    ...lead,
    company,
    notes: notes.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    followups: followups.sort((a, b) => (a.next_contact_date < b.next_contact_date ? -1 : 1)),
    status_history: statusHistory.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    contacts: contacts.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    assigned_user: assignedUser,
  };
}

export async function updateLeadStatus(
  leadId: string,
  toStatus: LeadStatus,
  changedBy: string
): Promise<Lead> {
  const store = getStore();
  const lead = await store.get<Lead>(TABLES.leads, leadId);
  if (!lead) throw new Error("Lead não encontrado");

  const updated = await store.update<Lead>(TABLES.leads, leadId, {
    status: toStatus,
    updated_at: new Date().toISOString(),
  });

  await store.insert<LeadStatusHistory>(TABLES.leadStatusHistory, {
    lead_id: leadId,
    from_status: lead.status,
    to_status: toStatus,
    changed_by: changedBy,
    created_at: new Date().toISOString(),
  });

  return updated;
}

export async function assignLead(leadId: string, userId: string | null): Promise<Lead> {
  const store = getStore();
  return store.update<Lead>(TABLES.leads, leadId, { assigned_to: userId });
}

export async function addLeadNote(leadId: string, userId: string, note: string): Promise<LeadNote> {
  const store = getStore();
  return store.insert<LeadNote>(TABLES.leadNotes, {
    lead_id: leadId,
    user_id: userId,
    note,
    created_at: new Date().toISOString(),
  });
}

export async function addLeadFollowup(
  leadId: string,
  userId: string,
  nextContactDate: string,
  nextContactTime: string | null,
  observation: string | null
): Promise<LeadFollowup> {
  const store = getStore();
  return store.insert<LeadFollowup>(TABLES.leadFollowups, {
    lead_id: leadId,
    user_id: userId,
    next_contact_date: nextContactDate,
    next_contact_time: nextContactTime,
    observation,
    done: false,
    created_at: new Date().toISOString(),
  });
}

export async function markFollowupDone(followupId: string, done: boolean): Promise<LeadFollowup> {
  const store = getStore();
  return store.update<LeadFollowup>(TABLES.leadFollowups, followupId, { done });
}

export async function addLeadContact(
  leadId: string,
  userId: string,
  contactType: LeadContact["contact_type"],
  result: LeadContact["result"],
  notes: string | null
): Promise<LeadContact> {
  const store = getStore();
  return store.insert<LeadContact>(TABLES.leadContacts, {
    lead_id: leadId,
    user_id: userId,
    contact_type: contactType,
    result,
    notes,
    created_at: new Date().toISOString(),
  });
}

export async function listAllFollowups(): Promise<LeadFollowup[]> {
  const store = getStore();
  return store.list<LeadFollowup>(TABLES.leadFollowups);
}

export async function listAllContacts(): Promise<LeadContact[]> {
  const store = getStore();
  return store.list<LeadContact>(TABLES.leadContacts);
}

export async function listAllLeads(): Promise<Lead[]> {
  const store = getStore();
  return store.list<Lead>(TABLES.leads);
}
