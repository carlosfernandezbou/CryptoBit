package es.cryptobit.repository;

import es.cryptobit.model.TransactionRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BlockchainRecordRepository extends MongoRepository<TransactionRecord, String> {
}