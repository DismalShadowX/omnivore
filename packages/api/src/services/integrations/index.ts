import { DeepPartial, FindOptionsWhere } from 'typeorm'
import { Integration } from '../../entity/integration'
import { authTrx } from '../../repository'
import { IntegrationClient } from './integration'
import { NotionClient } from './notion'
import { PocketClient } from './pocket'
import { ReadwiseClient } from './readwise'

export const getIntegrationClient = (
  name: string,
  token: string,
  integrationData?: Integration
): IntegrationClient => {
  switch (name.toLowerCase()) {
    case 'readwise':
      return new ReadwiseClient(token)
    case 'pocket':
      return new PocketClient(token)
    case 'notion':
      return new NotionClient(token, integrationData)
    default:
      throw new Error(`Integration client not found: ${name}`)
  }
}

export const deleteIntegrations = async (
  userId: string,
  criteria: string[] | FindOptionsWhere<Integration>
) => {
  return authTrx(
    async (t) => t.getRepository(Integration).delete(criteria),
    undefined,
    userId
  )
}

export const removeIntegration = async (
  integration: Integration,
  userId: string
) => {
  return authTrx(
    async (t) => t.getRepository(Integration).remove(integration),
    undefined,
    userId
  )
}

export const findIntegration = async (
  where: FindOptionsWhere<Integration> | FindOptionsWhere<Integration>[],
  userId: string
) => {
  return authTrx(
    async (t) =>
      t.getRepository(Integration).findOneBy({
        ...where,
        user: { id: userId },
      }),
    undefined,
    userId
  )
}

export const findIntegrations = async (
  userId: string,
  where?: FindOptionsWhere<Integration> | FindOptionsWhere<Integration>[]
) => {
  return authTrx(
    async (t) =>
      t.getRepository(Integration).findBy({
        ...where,
        user: { id: userId },
      }),
    undefined,
    userId
  )
}

export const saveIntegration = async (
  integration: DeepPartial<Integration>,
  userId: string
) => {
  return authTrx(
    async (t) => t.getRepository(Integration).save(integration),
    undefined,
    userId
  )
}

export const updateIntegration = async (
  id: string,
  integration: DeepPartial<Integration>,
  userId: string
) => {
  return authTrx(
    async (t) => t.getRepository(Integration).update(id, integration),
    undefined,
    userId
  )
}
