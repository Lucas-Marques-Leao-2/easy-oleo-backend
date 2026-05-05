import { ConflictException, NotFoundException } from "@nestjs/common";

import { CustomersRepository } from "./customers.repository";
import { CustomersService } from "./customers.service";

const now = new Date("2026-04-20T10:00:00.000Z");

function customer(overrides: Record<string, unknown> = {}) {
  return {
    id: "customer-1",
    type: "PJ",
    name: "Auto Peças Maceió Ltda",
    document: "11222333000181",
    street: "Av. Álvaro Otacílio",
    number: "4512",
    complement: "Galpão B",
    district: "Ponta Verde",
    city: "Maceió",
    state: "AL",
    zipCode: "57035290",
    email: "compras@autopecasmaceio.com.br",
    phones: [
      { id: "phone-1", number: "82999998888", customerId: "customer-1" },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("CustomersService", () => {
  let repo: jest.Mocked<CustomersRepository>;
  let service: CustomersService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDocument: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<CustomersRepository>;
    service = new CustomersService(repo);
  });

  it("creates a customer when document is unique", async () => {
    const dto = {
      type: "PJ" as const,
      name: "Auto Peças Maceió Ltda",
      document: "11222333000181",
      street: "Av. Álvaro Otacílio",
      number: "4512",
      city: "Maceió",
      state: "AL",
      zipCode: "57035290",
      email: "compras@autopecasmaceio.com.br",
      phones: ["82999998888"],
    };
    repo.findByDocument.mockResolvedValue(null);
    repo.create.mockResolvedValue(customer() as never);

    await expect(service.create(dto)).resolves.toMatchObject({
      id: "customer-1",
      document: dto.document,
      phones: [{ id: "phone-1", number: "82999998888" }],
    });
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it("rejects duplicate documents", async () => {
    repo.findByDocument.mockResolvedValue(customer() as never);

    await expect(
      service.create({ document: "11222333000181" } as never),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("finds, updates, and removes existing customers", async () => {
    repo.findAll.mockResolvedValue([customer()] as never);
    repo.findById.mockResolvedValue(customer() as never);
    repo.update.mockResolvedValue(customer({ name: "Updated" }) as never);
    repo.remove.mockResolvedValue(customer() as never);

    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findOne("customer-1")).resolves.toMatchObject({
      id: "customer-1",
    });
    await expect(
      service.update("customer-1", { name: "Updated" }),
    ).resolves.toMatchObject({
      name: "Updated",
    });
    await expect(service.remove("customer-1")).resolves.toMatchObject({
      id: "customer-1",
    });
  });

  it("throws NotFoundException before update or remove when missing", async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.update("missing", { name: "Updated" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
